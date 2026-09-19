import subprocess
import threading
import os
import re
import time
import platform
import signal
from pathlib import Path
from collections import deque

from .utils import (
    strip_ansi,
    analyze_label_metadata,
    generate_m3u_playlist,
    fetch_metadata,
    normalize_media_item,
)

APP_ROOT = Path(__file__).resolve().parent.parent


def resolve_path(raw_value, default_value):
    """Resolve paths for wrapper/rootfs/cache with sensible defaults."""
    if raw_value:
        candidate = Path(raw_value)
        if not candidate.is_absolute():
            candidate = (APP_ROOT / candidate).resolve(strict=False)
        return candidate.resolve(strict=False)

    candidate = Path(default_value)
    if not candidate.is_absolute():
        candidate = (APP_ROOT / candidate).resolve(strict=False)
    return candidate.resolve(strict=False)


def get_wrapper_bin_path():
    configured = os.environ.get("WRAPPER_BIN")
    candidates = []
    if configured:
        candidates.append(resolve_path(configured, "/app/wrapper"))

    candidates.extend(
        [
            resolve_path("/app/wrapper", "/app/wrapper"),
            resolve_path("/app/wrapper/wrapper", "/app/wrapper/wrapper"),
            (APP_ROOT / "wrapper").resolve(strict=False),
            (APP_ROOT / "wrapper" / "wrapper").resolve(strict=False),
        ]
    )

    for candidate in candidates:
        if candidate.exists() and candidate.is_file():
            return candidate

    return resolve_path(os.environ.get("WRAPPER_BIN", "/app/wrapper"), "/app/wrapper")


def get_wrapper_rootfs_path():
    configured = os.environ.get("WRAPPER_ROOTFS")
    return resolve_path(configured, "/app/rootfs")


def get_wrapper_cache_dir():
    configured = os.environ.get("WRAPPER_CACHE_DIR")
    cache_dir = resolve_path(configured, "/app/config/wrapper")
    cache_dir.mkdir(parents=True, exist_ok=True)
    return cache_dir


def _parse_duration_to_seconds(duration_str: str | None) -> int | None:
    """Converte 'mm:ss' ou 'hh:mm:ss' em segundos. Retorna None se inválido."""
    if not duration_str:
        return None

    parts = str(duration_str).split(":")
    try:
        nums = list(map(int, parts))
    except ValueError:
        return None

    if len(nums) == 2:
        m, s = nums
        return m * 60 + s
    if len(nums) == 3:
        h, m, s = nums
        return h * 3600 + m * 60 + s
    return None


def normalize_release_type(item: dict) -> dict:
    """Classifica release em album/ep/single/music_video/compilation/unknown.

    Baseado em tipo bruto + track_count + duração, compatível com regras de DSPs.
    """
    raw_type = (item.get("type") or "").strip().lower()
    attrs = item.get("attributes", {}) or {}

    track_count = attrs.get("track_count")
    if isinstance(track_count, str):
        track_count = int(track_count) if track_count.isdigit() else None

    duration_sec = attrs.get("duration_sec")
    if duration_sec is None:
        duration_sec = _parse_duration_to_seconds(attrs.get("duration")) or 0
    if duration_sec is None:
        duration_sec = 0

    # music video primeiro
    if raw_type in ("music_video", "music-video", "musicvideo"):
        kind = "music_video"
        return {
            "kind": kind,
            "track_count": track_count or 0,
            "duration_sec": duration_sec,
            "raw_type": raw_type,
        }

    # compilações
    if raw_type in ("compilation", "compilation-album", "compilacao"):
        kind = "compilation"
        return {
            "kind": kind,
            "track_count": track_count or 0,
            "duration_sec": duration_sec,
            "raw_type": raw_type,
        }

    # playlist/station não entram
    if raw_type in ("playlist", "station"):
        kind = "unknown"
        return {
            "kind": kind,
            "track_count": track_count or 0,
            "duration_sec": duration_sec,
            "raw_type": raw_type,
        }

    tc = track_count or 0
    is_long = duration_sec >= 30 * 60  # 30 minutos

    if tc <= 0 and is_long:
        kind = "album"
    elif 1 <= tc <= 3 and not is_long:
        kind = "single"
    elif 4 <= tc <= 6 and not is_long:
        kind = "ep"
    elif tc >= 7 or is_long:
        kind = "album"
    else:
        kind = "unknown"

    return {
        "kind": kind,
        "track_count": tc,
        "duration_sec": duration_sec,
        "raw_type": raw_type,
    }


class ProcessManager:
    def __init__(self):
        self.process = None
        self.running = False
        self.logs = deque(maxlen=300)
        self.needs_input = False
        self.input_options = []
        self.selection_id = None
        self._lock = threading.Lock()
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    def _log(self, message):
        with self._lock:
            self.logs.append(message)

    def stop(self):
        if self.process:
            try:
                try:
                    self.process.terminate()
                except Exception:
                    pass
                try:
                    self.process.wait(timeout=2)
                except Exception:
                    if platform.system() == 'Windows':
                        try:
                            self.process.send_signal(signal.CTRL_BREAK_EVENT)
                        except Exception:
                            pass
                        try:
                            self.process.kill()
                        except Exception:
                            pass
            except Exception:
                pass
        with self._lock:
            self.running = False
            self.needs_input = False
            self._log(">>> Processo interrompido <<<")

    def write_input(self, text):
        with self._lock:
            proc = self.process
            running = self.running
        if proc and running and proc.poll() is None and getattr(proc, 'stdin', None) is not None:
            try:
                proc.stdin.write(f"{text}")
                proc.stdin.flush()
                self._log(f">>> Input enviado: {text}")
                with self._lock:
                    self.needs_input = False
                return True
            except Exception:
                return False
        return False

    def close_stdin(self):
        with self._lock:
            proc = self.process
            running = self.running
        if proc and running and getattr(proc, 'stdin', None) is not None:
            try:
                proc.stdin.close()
                with self._lock:
                    self.needs_input = False
                return True
            except Exception:
                return False
        return False

    def get_status(self):
        with self._lock:
            if self.process and self.process.poll() is not None:
                self.running = False
            return {
                "running": self.running,
                "logs": list(self.logs),
                "needs_input": self.needs_input,
                "options": self.input_options,
                "request_id": self.selection_id,
                "selection_id": self.selection_id,
                "last_output_at": getattr(self, 'last_output_at', None),
            }


class WrapperManager(ProcessManager):
    def __init__(self):
        super().__init__()
        self.last_output_at = None
        self.needs_2fa = False
        self.cached_2fa_attempt = False

    def _set_2fa_state(self, enabled):
        with self._lock:
            self.needs_2fa = bool(enabled)
            if not enabled:
                self.cached_2fa_attempt = False

    def _looks_like_2fa_prompt(self, text):
        lower = text.lower()
        if not lower:
            return False

        if re.search(r"\b2fa\s*:\s*(true|yes|requested|required)\b", lower):
            return True

        has_2fa_signal = any(token in lower for token in [
            "2fa", "otp", "one-time", "verification code", "authentication code",
            "enter the code", "verify code", "security code"
        ])
        if not has_2fa_signal:
            return False

        auth_context = any(token in lower for token in [
            "credentialhandler", "credential handler", "auth", "authenticate",
            "login", "verification", "verify", "code"
        ])
        return auth_context

    def start(self, email, password):
        if self.running: return False

        wrapper_path = get_wrapper_bin_path()
        rootfs_dir = get_wrapper_rootfs_path()

        if not wrapper_path.exists() or not wrapper_path.is_file():
            self._log(f"Erro Wrapper: binary not found at {wrapper_path}")
            return False
        if not rootfs_dir.exists() or not rootfs_dir.is_dir():
            self._log(f"Erro Wrapper: rootfs not found at {rootfs_dir}")
            return False

        cmd = [str(wrapper_path), "-L", f"{email}:{password}"]

        try:
            env = os.environ.copy()
            env["TERM"] = "dumb"
            env.setdefault("WRAPPER_BIN", str(wrapper_path))
            env.setdefault("WRAPPER_ROOTFS", str(rootfs_dir))
            env.setdefault("WRAPPER_CACHE_DIR", str(get_wrapper_cache_dir()))
            kwargs = dict(stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                          stdin=subprocess.PIPE, bufsize=1, universal_newlines=True,
                          cwd=str(APP_ROOT), env=env)
            if platform.system() == 'Windows':
                kwargs.update(creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
            else:
                kwargs.update(preexec_fn=os.setsid)
            self.process = subprocess.Popen(cmd, **kwargs)
            with self._lock:
                self.running = True
                self.needs_2fa = False
                self.logs.clear()
                self.logs.append("Iniciando Wrapper...")
            threading.Thread(target=self._stream_logs, daemon=True).start()
            return True
        except Exception as e:
            self._log(f"Erro Wrapper: {e}")
            return False

class DownloaderManager(ProcessManager):
    def __init__(self):
        super().__init__()
        self.current_format = "alac"
        self.is_playlist = False
        self.selection_context = None  # "albums" ou "music_videos"

        # Pré-compila Regex para performance
        self.re_table = re.compile(r"^\s*\|\s*(\d+)\s*\|")
        self.re_list = re.compile(r"(?:^|\s|\[\w+\]\s+)(\d+)\s*[.\:\-\)\]]\s+(.+)$")
        self.selection_keywords = [
            "select:", "select one option", "select an option", "select one option from the list",
            "enter choice", "choice:", "selection:",
            "select item", "select items", "select a number", "enter a number",
            "choose:", "choose a number", "selecione", "escolha",
            "please select", "select from", "select all",
            "options separated", "ranges supported",
        ]
        self.re_date = re.compile(r"(\d{4}([-/.]\d{2}([-/.]\d{2})?)?)")
        self.re_duration = re.compile(r"(\d{1,3}:\d{2}(?::\d{2})?)")
        self.re_track_count = re.compile(
            r"(\d{1,3})\s*(?:tracks?|songs?|items?|faixas?)",
            re.IGNORECASE,
        )

    def _split_table_row(self, clean: str):
        normalized = clean.replace("│", "|")
        if "|" not in normalized:
            return None
        cells = [c.strip() for c in normalized.strip().strip("|").split("|")]
        if not cells or not cells[0].isdigit():
            return None
        return cells

    def _extract_table_metadata(self, cells):
        entry_id = cells[0]
        columns = cells[1:]
        if not columns:
            return None

        label = columns[0]
        date = ""
        kind_raw = ""
        is_live = False
        duration_str = ""
        track_count = None
        extras = []

        for col in columns[1:]:
            col_stripped = col.strip()
            lower = col_stripped.lower()

            if not date and self.re_date.search(col_stripped):
                date = col_stripped
                continue

            if not duration_str and self.re_duration.search(col_stripped):
                duration_str = col_stripped
                continue

            if track_count is None:
                m = self.re_track_count.search(col_stripped)
                if m:
                    try:
                        track_count = int(m.group(1))
                    except ValueError:
                        track_count = None
                    continue

            if not kind_raw and any(t in lower for t in [
                "album", "single", "ep", "compilation",
                "playlist", "song", "music video", "video",
            ]):
                kind_raw = col_stripped
                continue

            if any(t in lower for t in ["live", "concert"]):
                is_live = True
                continue

            extras.append(col_stripped)

        attributes = {
            "name": label,
            "releaseDate": date or "",
            "track_count": track_count if track_count is not None else 0,
            "duration": duration_str,
            "duration_sec": _parse_duration_to_seconds(duration_str) or 0,
            "isLive": is_live,
        }

        raw_type = kind_raw or "unknown"
        if self.selection_context == "music_videos":
            raw_type = "music_video"

        release_info = normalize_release_type({
            "type": raw_type,
            "attributes": attributes,
        })
        kind = release_info["kind"]

        normalized = normalize_media_item({
            "id": entry_id,
            "type": kind,
            "attributes": attributes,
        })

        normalized["tags"] = analyze_label_metadata(label)["tags"]
        normalized["extra"] = ", ".join([e for e in extras if e])
        normalized["label"] = label
        normalized["kind"] = kind
        normalized["track_count"] = release_info["track_count"]
        normalized["duration_sec"] = release_info["duration_sec"]
        normalized["raw_type"] = release_info["raw_type"]

        return normalized

    def start(self, link, args=None):
        if self.running:
            return False

        amd_dir = os.path.join(self.base_dir, "apple-music-downloader")
        if not os.path.isdir(amd_dir):
            self._log(f"Erro Downloader: apple-music-downloader folder not found at {amd_dir}")
            return False

        cmd = ["go", "run", "main.go"]
        self.current_format = "alac"
        if args:
            cmd.extend(args)
            if "--atmos" in args:
                self.current_format = "atmos"
            elif "--aac" in args:
                self.current_format = "aac"

        cmd.append(link)

        self.is_playlist = False
        try:
            meta = fetch_metadata(link)
            if meta and meta.get('type') == 'Playlist':
                self.is_playlist = True
        except Exception:
            pass

        try:
            try:
                data_dir = os.path.join(self.base_dir, "data")
                os.makedirs(data_dir, exist_ok=True)
                with open(os.path.join(data_dir, "current_task.log"), "w", encoding="utf-8") as f:
                    f.write(f"--- Starting download: {link} at {time.ctime()} ---")
            except Exception:
                pass

            try:
                self.last_output_at = time.time()
            except Exception:
                pass

            env = os.environ.copy()
            env["TERM"] = "dumb"
            kwargs = dict(
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE,
                bufsize=1,
                universal_newlines=True,
                cwd=amd_dir,
                env=env,
            )
            if platform.system() == 'Windows':
                kwargs.update(creationflags=subprocess.CREATE_NEW_PROCESS_GROUP)
            else:
                kwargs.update(preexec_fn=os.setsid)
            self.process = subprocess.Popen(cmd, **kwargs)
            with self._lock:
                self.running = True
                self.needs_input = False
                self.input_options = []
                self.selection_id = None
                self.logs.clear()
                self.logs.append(f"Iniciando: {link}")
            threading.Thread(target=self._stream_logs, daemon=True).start()
            return True
        except Exception as e:
            self._log(f"Erro Downloader: {e}")
            return False

    def _parse_options(self, buffer):
        options = []
        for line in reversed(buffer[-50:]):
            clean = strip_ansi(line).strip()
            if not clean or any(k in clean.lower() for k in self.selection_keywords):
                continue
            if "+---" in clean or "ALBUM NAME" in clean or "─" in clean or "┼" in clean or "┌" in clean or "└" in clean:
                continue

            m = self.re_table.search(clean)
            if m:
                cells = self._split_table_row(clean)
                parsed = self._extract_table_metadata(cells) if cells else None
                if parsed:
                    options.insert(0, parsed)
                continue

            m = self.re_list.search(clean)
            if m:
                label = m.group(2).strip()
                normalized = normalize_media_item({
                    "id": m.group(1),
                    "type": "unknown",
                    "attributes": {"name": label},
                })
                normalized["tags"] = analyze_label_metadata(label)["tags"]
                normalized["duration"] = ""
                normalized["label"] = label
                normalized.setdefault("kind", "unknown")
                options.insert(0, normalized)

        return options

    def _merge_options(self, candidates):
        merged = []
        seen = set()
        for option in list(candidates or []):
            name = option.get("label") or option.get("name")                 or option.get("attributes", {}).get("name")

            key = (option.get("id"), name)
            if option.get("id") is None or name is None:
                merged.append(option)
                continue

            if key not in seen:
                merged.append(option)
                seen.add(key)
        return merged

    def _stream_logs(self):
        log_buffer = []
        try:
            while True:
                if not self.process:
                    break
                line = self.process.stdout.readline()
                if line == '' or line is None:
                    break
                line = line.strip()
                if not line:
                    if self.process.poll() is not None:
                        break
                    continue

                try:
                    self.last_output_at = time.time()
                    data_dir = os.path.join(self.base_dir, "data")
                    os.makedirs(data_dir, exist_ok=True)
                    with open(os.path.join(data_dir, "current_task.log"), "a", encoding="utf-8") as f:
                        f.write(line + "")
                except Exception:
                    pass

                self._log(line)
                log_buffer.append(line)
                clean_line = strip_ansi(line).lower()

                if "select from the albums options above" in clean_line:
                    self.selection_context = "albums"
                elif "select from the music-videos options above" in clean_line:
                    self.selection_context = "music_videos"

                if any(marker in clean_line for marker in [
                    "error detected, press enter",
                    "press enter to try again",
                    "failed to run v4:",
                    "key retrieval failed",
                    "invalid ckc",
                ]):
                    self._log(">>> ERRO DETECTADO, encerrando entrada interativa <<<")
                    self.close_stdin()

                if any(k in clean_line for k in self.selection_keywords):
                    with self._lock:
                        self.needs_input = True
                        ctx = self.selection_context or "unknown"
                        self.selection_id = f"{ctx}-selection-{int(time.time() * 1000)}"

                    options = self._parse_options(log_buffer)
                    if options:
                        with self._lock:
                            self.input_options = options
                        self._log(">>> AGUARDANDO SELEÇÃO DO USUÁRIO <<<")
                        try:
                            from . import socketio
                            socketio.emit(
                                'selection_required',
                                {
                                    'options': options,
                                    'options_count': len(options),
                                    'selection_id': self.selection_id,
                                    'request_id': self.selection_id,
                                    'context': self.selection_context,
                                },
                                skip_sid=True,
                            )
                        except Exception as e:
                            self._log(f"Aviso: Falha ao emitir evento Socket.IO: {e}")
                    else:
                        self._log(">>> PROMPT DETECTADO, AGUARDANDO OPÇÕES <<<")

                if self.needs_input:
                    retry_options = self._parse_options(log_buffer)
                    if retry_options:
                        merged = self._merge_options(self.input_options + retry_options)
                        with self._lock:
                            self.input_options = merged
                        self._log(">>> OPÇÕES DETECTADAS, AGUARDANDO SELEÇÃO <<<")
                        try:
                            from . import socketio
                            socketio.emit(
                                'selection_required',
                                {
                                    'options': merged,
                                    'options_count': len(merged),
                                    'selection_id': self.selection_id,
                                    'request_id': self.selection_id,
                                    'context': self.selection_context,
                                },
                                skip_sid=True,
                            )
                        except Exception as e:
                            self._log(f"Aviso: Falha ao emitir evento Socket.IO: {e}")
        finally:
            with self._lock:
                self.running = False
            if self.is_playlist:
                time.sleep(1)
                generate_m3u_playlist(self.current_format)

    def is_complete(self):
        if self.process is None:
            return True
        if self.process.poll() is not None:
            return True

        if hasattr(self, 'last_output_at') and time.time() - self.last_output_at > 7200:
            self._log("Download timeout - marking complete")
            return True

        log_text = ' '.join(self.logs[-20:]).lower()
        complete_patterns = [
            'download complete', 'all tracks processed', 'finished',
            'total downloaded', 'process finished', 'exit status 0',
        ]
        for pattern in complete_patterns:
            if pattern in log_text:
                self._log(f"Download completion detected: {pattern}")
                return True

        return False


wrapper = WrapperManager()
downloader = DownloaderManager()