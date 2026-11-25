# FEATURES_AND_PLAN — Apple Music Downloader vs. Tidabie

Research + gap analysis + implementation plan. Sources: [tidabie.com/apple-music/apple-music-lossless-download.html](https://www.tidabie.com/apple-music/apple-music-lossless-download.html), [tidabie.com/music-go/](https://www.tidabie.com/music-go/), current repo code, reference screenshots [1] track selection grid, [2] convert screen ("2 songs, total duration"), [3] Music Settings dialog (Conversion Mode / Output Format / Bit Depth / Sample Rate / Output Folder).

Date: 2026-11-25

---

## 0. What Tidabie actually offers (extracted)

### Quality / formats
- Output formats: **MP3, AAC, WAV, FLAC, AIFF, ALAC** (ALAC uses `.m4a` extension, Apple-ecosystem friendly).
- Apple Music lossless tiers: **Lossless up to 24-bit/48 kHz**, **Hi-Res Lossless up to 24-bit/192 kHz** (Hi-Res needs external DAC on most devices).
- Settings dialog exposes: **Conversion Mode** (Download vs **Record Mode** — record = re-capture for maximum fidelity), **Output Format**, **Bit Depth**, **Sample Rate**, **Output Folder** (per screenshot [3]).
- **Dolby Atmos / Spatial Audio**: Apple Atmos via dedicated path; Amazon Music supports **E-AC3 & AC4** output.
- Batch conversion at **up to 10x speed**, speed user-adjustable ("adjust conversion speed flexibly").
- Preserves **full ID3 tags** (title, album, artist, year, track #), **album artwork**, and **lyrics**; output organized by **Playlist / Artist / Album** via folder templates.

### Content types & sources
- Downloads **songs, albums, playlists, podcasts, audiobooks, radio shows, MVs** (YouTube).
- Services: Apple Music, Spotify, Amazon Music, Tidal, Deezer, Qobuz, Line Music, Pandora, YouTube Music, SoundCloud, YouTube, Audible (audiobooks).
- Loads full **Apple Music / iTunes library** in-app, select-all, browse by catalog (not just link-paste).
- **Podcast module**: stream + download from **126k+ shows** (BBC, TED, NPR, ESPN, Wondery…), batch to MP3/MP4, top-20 per genre.
- **Radio module**: play + **record 67k+ shows** losslessly (FLAC/MP3/AAC/AIFF/ALAC/WAV), 20 genres.

### Built-in tools
- **AI Audio Splitter** — vocal/instrumental separation, batch, output FLAC/MP3/M4A/AIFF/OGG/WAV.
- **AA/AAX Converter** — Audible/iTunes audiobooks → MP3/M4A/M4B.
- **Format Converter** — local files → MP3/M4A/FLAC/WAV/OGG/AIFF.
- **Burn CD** — converted songs → audio CD.
- **Audio Editor** — cut, splice, mix.
- **Tag Editor** — artwork, title, artist, album, year, track number.
- **Export to iTunes**, History module with "open folder" per track, software cache clear, 48-language UI. Personal use only.

---

## 1. Feature comparison: our app vs. Tidabie

Current-state evidence: `src/lib/music-api.ts:7` (format union), `src/components/settings-page.tsx:15-19` (config fields), `src/components/download-dashboard.tsx:44,133` (format picker), `app/utils.py:8-31` (backend config keys), `app/queue_manager.py:259-271` (download flags `--atmos/--aac/--cover/--lyrics`).

| Feature | Tidabie | Ours (today) | Gap |
|---|---|---|---|
| Output formats | MP3, AAC, WAV, FLAC, AIFF, ALAC | **alac / aac / atmos** only (`music-api.ts:7`, dashboard picker) | MP3, FLAC, WAV, AIFF missing from UI+union |
| `convert-format` backend key | yes | **exists** (`app/utils.py:23`) but not exposed in settings UI | UI only |
| Bit depth / sample rate | selectable for ALAC/lossless (screenshot [3]) | **absent** (no keys, no UI) | Config + ffmpeg wiring |
| Conversion Mode (download vs record) | yes | download-only via wrapper-lite | Wrapper-level decision |
| Dolby Atmos | yes (incl. E-AC3/AC4 for Amazon) | **yes** — `--atmos` flag (`queue_manager.py:260`), dedicated folder | AC4/E-AC3 explicit output option |
| Hi-Res 24-bit/192 kHz | yes | implied by ALAC path, not selectable | Expose it |
| Batch download + total duration (screenshot [2]) | yes | selection grid exists ([1], `submitSelection` at `music-api.ts:80`); **no "N songs · total duration" summary, adds one link at a time** | UI aggregation |
| Speed multiplier (up to 10x) | yes, adjustable | fixed sequential worker; queue supports pause/reorder/retry | Concurrency knob |
| ID3 tags preserved | yes | preserved by wrapper (per-format folders, tag keys `explicit-tag/clean-tag/master-tag` in `app/utils.py:20-22`) | Verify + show in UI |
| Album artwork | yes | **flag exists** (`download-cover` → `--cover`, `queue_manager.py:268`) but toggle **not in settings UI**, key not in `BOOL_CONFIG_KEYS` | Bug: silently unconfigurable |
| Lyrics | yes (embedded) | **flag exists** (`download-lyrics` → `--lyrics`, `queue_manager.py:270`) but no UI toggle, not in `BOOL_CONFIG_KEYS` | Same bug as cover |
| Folder templates (Artist/Album/Playlist/file) | yes | **yes** (`artist/album/song-file-format`, backend also has `playlist-folder-format` unused in UI) | Expose playlist folder + token preview |
| History / completed library + open folder | yes | queue keeps `completed` items with `existing_path` (`music-api.ts:15`), no dedicated History view | UI only |
| Load full library / browse catalog | yes | link-paste + analyze only (`/analyze_link`) | Needs wrapper catalog API |
| Multi-service (Spotify, Tidal…) | yes | Apple Music only | Out of scope (roadmap) |
| Podcast player/downloader | yes | no | Phase 3 |
| Radio record | yes | no | Phase 3 |
| AI audio splitter | yes | no | Phase 3 |
| Format converter (local files) | yes | config keys exist (`convert-format`, `ffmpeg-path`, `ffmpeg-args`) — no local-file tool UI | Phase 2/3 |
| Tag editor | yes | no | Phase 2 |
| Audio editor (cut/splice) | yes | no | Phase 3 |
| AA/AAX converter | yes | no | **Not recommended** (Audible DRM — see §4.3) |
| Burn CD | yes (desktop app) | no | Not possible in web app — offer burn-ready export |
| i18n UI | 48 langs | pt-BR strings hardcoded in components | i18n lib (low priority) |
| Background/server-side downloads | desktop app runs in bg | **already better**: queue runs server-side in Flask, survives browser close; Socket.IO live progress (`connectMusicSocket`, `music-api.ts:86`) | none — market our strength |

---

## 2. Prioritized feature list

Difficulty: **S** ≈ ≤1 day, **M** ≈ 2–5 days, **L** ≈ 1–3 weeks (mostly wrapper/backend).

| # | Feature | Why | Difficulty |
|---|---|---|---|
| P1-1 | Fix `download-cover` / `download-lyrics`: add to `BOOL_CONFIG_KEYS` (`app/utils.py:24-29`), toggles in Settings UI | Flags already flow to `--cover/--lyrics` (`queue_manager.py:267-271`); currently dead config | **S** |
| P1-2 | Music Settings dialog mirroring screenshot [3]: grouped Conversion-adjacent controls (Output Format, Bit Depth, Sample Rate, Output Folder) instead of flat text fields | Tidabie parity on the single most important screen | **S/M** |
| P1-3 | Batch add from selection grid: multi-select → N queue items + "N songs · total duration · ~size" summary bar (screenshot [2]) | Big UX differentiator vs one-link-at-a-time; `SelectionOption.duration_sec/track_count` already typed (`music-api.ts:29-31`) | **M** |
| P1-4 | History view: completed tasks with format, path, time, "reveal folder"/download link | `existing_path` already returned; cheap, high perceived value | **S** |
| P1-5 | Quality presets: "CD 16/44.1 · Hi-Res 24/48 · Hi-Res Lossless 24/192 · Atmos" chips | Makes 24-bit/192 kHz tangible without jargon | **S** |
| P1-6 | Expose `playlist-folder-format` + live preview of file-name templates (`{ArtistName}` etc.) | Backend key exists, UI doesn't | **S** |
| P2-1 | Full format matrix: MP3, FLAC, WAV, AIFF end-to-end (union in `music-api.ts:7`, dashboard picker, backend `convert-format`/ffmpeg mapping, per-format folder default) | Headline Tidabie claim | **M** |
| P2-2 | Bit depth + sample rate enforcement via ffmpeg args (`-ar 192000 -c:a alac/flac`, `ffmpeg-args` key exists) | Pairs with P2-1 | **M** |
| P2-3 | ID3/tag verification pass + basic Tag Editor (read/edit title, artist, album, year, track, artwork) on downloaded files via `mutagen` server-side | Tidabie sells "keep full ID3 tags"; editing = retention proof | **M** |
| P2-4 | Lyrics embedding modes: `.lrc` sidecar vs embedded SYLT/LYRICS field; preview in task drawer | Flag exists; make format choosable | **M** |
| P2-5 | Concurrency / "speed" control: parallel worker count (1–10) in queue manager + per-queue ETA | Honest web-app version of "10x speed" | **M** |
| P2-6 | Per-task format/quality override (not only global config) | Pro-library behavior | **M** |
| P3-1 | Explicit Atmos output: AC4/E-AC3 passthrough option + detection badge in selection grid | We already have `--atmos`; add transparency | **L** |
| P3-2 | Local Format Converter tool (pick file in library folder → convert with ffmpeg) | Reuses P2-1 pipeline | **M/L** |
| P3-3 | AI vocal/instrumental splitter (Demucs backend job, queue-integrated) | Wow-factor, GPU-heavy | **L** |
| P3-4 | Catalog browsing / full library loading (beyond link paste) | Needs wrapper-lite endpoints | **L** |
| P3-5 | Podcast module (Apple Podcasts RSS is public → most feasible of the "extras") | New content axis | **L** |
| P3-6 | Burn-ready export (ZIP/ISO + CUE sheet) instead of literal CD burning | Web-app constraint, see §4.3 | **M** |
| ✗ | AA/AAX converter, radio recording, audio editor, multi-service | DRM/ToS risk or desktop-only or scope creep | Not planned |

---

## 3. Implementation roadmap

### Phase 1 — Quick wins (config + UI on top of existing plumbing)
1. **P1-1 cover/lyrics fix** — add keys to `BOOL_CONFIG_KEYS`, two `Toggle`s in the "Comportamento dos downloads" settings group. Verify `validate_config_payload` accepts them (`app/routes.py:226`).
2. **P1-2 Music Settings dialog** — refactor `settings-page.tsx` into grouped sections styled like screenshot [3] (Format, Quality, Destination) with selects instead of free-text where possible.
3. **P1-5 Quality presets** — new config keys `bit-depth`, `sample-rate` (accepted passthrough) + preset chips; pass through to wrapper on next phase; in P1 store + display only.
4. **P1-4 History view** — filter `/api/state` queue for `completed`, dedicated tab/section with `existing_path` + re-download actions; no backend change.
5. **P1-6 Playlist folder + template preview** — expose `playlist-folder-format`; render sample path from tokens.
6. **P1-3 Batch add** — extend selection grid submit (`submit_selection` → per-item `/download` fan-out if wrapper lacks bulk) with summary footer ("2 songs · 7:31 total").

**Exit criteria:** cover/lyrics actually toggle real behavior; a Tidabie-style settings screen exists; multi-track playlist adds in one action with duration summary.

### Phase 2 — Medium (real format matrix + tags + throughput)
1. **P2-1/2 FLAC/MP3/WAV/AIFF + bit depth/sample rate** — extend `QueueItem.format` union; map format+bit-depth+sample-rate → wrapper `convert-format` + `ffmpeg-args` (`-ac 24 -ar 192000 -c:a flac|alac|libmp3lame|pcm_s16le`); per-format save folder defaults; progress surfaced via existing Socket.IO events.
2. **P2-3 Tag pipeline** — after download, a `tag_check` step (mutagen) writes/repairs ID3 + artwork; new endpoint `POST /api/tag_edit`; UI editor modal reusing task drawer.
3. **P2-4 Lyrics modes** — config `lyrics-mode: sidecar|embed|both`; `--lyrics` stays, post-process decides placement; preview panel shows parsed LRC timestamps.
4. **P2-5 Concurrency** — turn single-worker loop in `queue_manager.py` into pool of N (config `max-concurrent`), per-item locks, recompute queue positions/ETA; expose "Speed" slider 1–N.
5. **P2-6 Per-task override** — `format`, `bit_depth`, `sample_rate` columns already per-row in queue DB (`queue_manager.py:41`); accept them on `/download`.

**Exit criteria:** pick "FLAC 24/192" in UI → file on disk is FLAC 24-bit 192 kHz with tags + lyrics; 5 concurrent downloads with correct progress attribution.

### Phase 3 — Advanced
1. **P3-1 Atmos transparency** — detect Atmos in `SelectionOption.tags` (wrapper metadata), badge it; explicit output container option (ALAC+AC4 passthrough vs downmix stereo) — depends on wrapper-lite capability, spike first.
2. **P3-2 Local converter tool** — server file picker over library root + reuse Phase-2 ffmpeg pipeline.
3. **P3-3 AI splitter** — Demucs (htdemucs) as queued job; CPU ~10× realtime, so offer only with concurrency budget or GPU worker option; outputs vocal/instrumental FLAC/WAV/MP3.
4. **P3-4 Catalog browsing** — needs wrapper-lite endpoints for library/search; currently only `analyze_link` + selection flow.
5. **P3-5 Podcasts** — Apple Podcasts/RSS public metadata; new module, download MP3 originals. (Radio recording skipped: stream-ripping scope + little overlap with our Apple-Music user.)
6. **P3-6 Burn-ready export** — ZIP (preserve order) + CUE sheet endpoint; document that actual burning is user-side (any desktop tool).

---

## 4. Technical feasibility notes

### 4.1 Phase 1
- Almost everything is **config/UI only**: backend already accepts arbitrary keys via `/save_config` (`music-api.ts:83`), wrapper-lite consumes them (`lite-server` at `:12340`, Docker network `wrapper-lite` hostname — see `settings-page.tsx:13`).
- **Real bug to fix first:** `download-cover`/`download-lyrics` are read at `app/queue_manager.py:267-271` but are absent from `BOOL_CONFIG_KEYS` in `app/utils.py` → likely rejected by `validate_config_payload` and never settable. Cheap, high-value.
- Batch add: if wrapper's selection flow only supports one download trigger, fan out N `/download` calls from the client and show one summary; no contract change needed. Beware 429 storms — the repo already has `FIX_429_SELECTION_ERROR.md`; serialize fan-out with small delay + existing queue dedup (`link` column).
- Duration summary uses `duration_sec`/`track_count` already typed in `SelectionOption` (`music-api.ts:29-31`).

### 4.2 Phase 2
- **ffmpeg is already a configured dependency** (`ffmpeg-path`, `ffmpeg-args`, `convert-after-download`, `keep-original` in `app/utils.py`) — the wrapper does post-download conversion; our job is a clean UI → args mapping and validating output with ffprobe (`-i file` → `Duration:` regex, `app/queue_manager.py:37` already parses progress).
- ALAC: `ffmpeg -c:a alac` (`.m4a` container); FLAC native; WAV `pcm_s24le`; MP3 `libmp3lame -b:a 320k`. 24-bit: `-sample_fmt s32 -ac 24` (192 kHz: `-ar 192000`). No Apple-side risk: source is already lossless when subscription permits.
- **Bit-depth ceiling is set by the source**, not ffmpeg: Apple Music caps at 24/192; document "up to" in UI. Don't let UI imply >192 kHz.
- Tag work: `mutagen` (pure python, pip-installable, fits Docker image) for MP3 (ID3), M4A/ALAC (MP4 ilst atoms — not ID3; label UI "tags" not "ID3" for accuracy), FLAC (Vorbis comments).
- Concurrency: `queue_manager.py` runs a sequential loop; a pool of N threads is safe because wrapper-lite spawns per-process — **spike wrapper-lite's own concurrency limit first** (login session reuse, rate limits). Speed multiplier ≠ magic: real ceiling = wrapper download bandwidth + Apple rate limiting; present concurrency honestly.
- Security note: file paths (`existing_path`) are server-side paths; never accept arbitrary user paths (path traversal). Tag editor must operate only under the configured library root.

### 4.3 Phase 3
- **Atmos:** Apple's Atmos streams are Dolby AC-4 in a lossless container; whether wrapper can pass through vs must re-record determines scope. Current `--atmos` flag proves the download path exists; the E-AC3/AC4 *output* claim from Tidabie is Amazon-side. Keep as "passthrough when available, stereo fallback" and label accordingly.
- **AI splitter:** Demucs 4 requires torch (~2 GB image growth) + CPU-heavy jobs (~5–10× realtime/song). Feasible as opt-in background job with its own queue class; skip in image by default, mount volume or GPU worker option.
- **CD burning:** impossible from a browser without WebUSB gymnastics; honest substitute = burn-ready bundle (ordered ZIP + CUE). Documented as intentional divergence from Tidabie.
- **AA/AAX converter:** Audible DRM (License/`activation bytes`) requires user's Audible credentials and a decryption step that is a ToS/legal gray area — **recommend not implementing**; if demand appears, scope = convert *user-owned DRM-free* audiobooks only.
- **Podcasts/radio:** podcast RSS is public and easy; radio 24/7 recording implies persistent server processes — bad fit for the container lifecycle; only on-demand recording, or skip.
- **Multi-service (Spotify/Tidal/…):** each needs its own wrapper/auth; treat as separate products, not features.

### 4.4 Where we already beat Tidabie (market it)
- Server-side queue: downloads keep running after browser close; Socket.IO live progress + selection events (`music-api.ts:86-100`). Tidabie is tied to one desktop.
- Retry/backoff built in (`failed_attempts`, `next_try_at` — `music-api.ts:13-14`); Tidabie has no visible retry policy.
- Self-hosted, no per-seat license, no 3-song free-trial cap, pt-BR first.

---

## Suggested build order (one line)

**P1-1 bug fix → P1-2 settings dialog → P1-4 history → P1-5 presets → P1-3 batch add → P2-1/2 format matrix → P2-3 tags → P2-5 concurrency → P2-4 lyrics modes → P2-6 per-task override → P3-1 Atmos → P3-2 converter tool → P3-6 burn-ready → P3-3 splitter → P3-5 podcasts → P3-4 catalog.**
