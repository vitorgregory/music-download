import { io, type Socket } from "socket.io-client";

export type QueueStatus = "pending" | "processing" | "completed" | "failed" | "dead" | "cancelled";
export type QueueItem = {
  id: number;
  link: string;
  format: "alac" | "aac" | "atmos";
  status: QueueStatus;
  title: string;
  progress: string | number;
  created_at?: string;
  position?: number;
  failed_attempts?: number;
  next_try_at?: string | null;
  existing_path?: string | null;
};
export type SelectionOption = {
  id: string;
  label: string;
  title?: string;
  artist?: string;
  extra?: string;
  kind?: string;
  category?: string;
  type?: string;
  category_label?: string;
  date?: string;
  releaseDate?: string;
  track_count?: number | null;
  duration?: string | number;
  duration_sec?: number | null;
  tags?: string[];
  selectable?: boolean;
};
export type MusicState = {
  wrapper: { running: boolean; logs: string[]; needs_2fa: boolean };
  downloader: {
    running: boolean;
    logs: string[];
    needs_selection: boolean;
    options: SelectionOption[];
    request_id?: string | null;
    selection_id?: string | null;
  };
  queue: { items: QueueItem[]; paused: boolean };
  wrapper_installed: boolean;
  downloader_installed: boolean;
};
export type Metadata = { title?: string; type?: string; image?: string };

const configuredBase = (import.meta.env['VITE_MUSIC_DOWNLOAD_API_URL'] as string | undefined)?.replace(/\/$/, "");
export const musicApiBase = configuredBase ?? "";
let csrfToken = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? "GET";
  if (method !== "GET" && !csrfToken) {
    const response = await fetch(`${musicApiBase}/api/csrf`, { credentials: "include" });
    if (response.ok) csrfToken = ((await response.json()) as { csrf_token?: string }).csrf_token ?? "";
  }
  const headers = new Headers(init?.headers);
  if (csrfToken && method !== "GET") headers.set("X-CSRFToken", csrfToken);
  const response = await fetch(`${musicApiBase}${path}`, { ...init, headers, credentials: "include" });
  const payload = await response.json().catch(() => ({})) as T & { message?: string };
  if (!response.ok) throw new Error(payload.message || `O servidor respondeu com erro ${response.status}.`);
  return payload;
}

function form(data: Record<string, string>) {
  return new URLSearchParams(data);
}

export const musicApi = {
  state: () => request<MusicState>("/api/state"),
  analyze: (link: string) => request<{ status: string; metadata?: Metadata; message?: string }>("/analyze_link", { method: "POST", body: form({ link }) }),
  download: (link: string, title: string, format: string) => request<{ status: string }>("/download", { method: "POST", body: form({ link, title, format }) }),
  pause: (paused: boolean) => request<{ paused: boolean }>("/api/pause_queue", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paused }) }),
  cancel: (id: number, status: string) => request<{ status: string }>("/api/cancel_task", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) }),
  move: (id: number, direction: "up" | "down") => request<{ moved: boolean }>("/api/move_queue", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, direction }) }),
  submitSelection: (selection: string[], selectionId?: string | null) => request<{ success: boolean; accepted: boolean; message?: string }>("/submit_selection", { method: "POST", body: form({ selection: selection.join(","), selection_id: selectionId ?? "" }) }),
  skipSelection: () => request<{ success: boolean; accepted: boolean }>("/skip_selection", { method: "POST" }),
  config: () => request<{ status: string; config: Record<string, string | boolean> }>("/get_config"),
  saveConfig: (config: Record<string, string | boolean>) => request<{ status: string; message?: string }>("/save_config", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(config) }),
};

export function connectMusicSocket(handlers: {
  onConnect: (connected: boolean) => void;
  onState: (state: MusicState) => void;
  onQueueChange: () => void;
  onSelection: (data: { options?: SelectionOption[]; selection_id?: string; request_id?: string }) => void;
}): Socket {
  const socket = io(musicApiBase || undefined, { transports: ["websocket", "polling"], withCredentials: true });
  socket.on("connect", () => handlers.onConnect(true));
  socket.on("disconnect", () => handlers.onConnect(false));
  socket.on("connect_error", () => handlers.onConnect(false));
  socket.on("queue_update", handlers.onQueueChange);
  socket.on("queue_progress", handlers.onQueueChange);
  socket.on("selection_required", handlers.onSelection);
  return socket;
}