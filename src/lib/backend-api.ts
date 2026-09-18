export type BackendQueueItem = {
  id: number;
  title: string;
  format: string;
  status: string;
  progress: string | number;
  failed_attempts?: number;
};

export type BackendState = {
  wrapper: { running: boolean; logs: string[]; needs_2fa: boolean };
  downloader: { running: boolean; logs: string[]; needs_selection: boolean };
  queue: { items: BackendQueueItem[]; paused: boolean };
};

let csrfToken = "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method?.toUpperCase() ?? "GET";
  if (method !== "GET" && !csrfToken) {
    const csrfResponse = await fetch("/api/csrf", { credentials: "include" });
    if (csrfResponse.ok) csrfToken = ((await csrfResponse.json()) as { csrf_token?: string }).csrf_token ?? "";
  }
  const headers = new Headers({ "Content-Type": "application/x-www-form-urlencoded", ...init?.headers });
  if (csrfToken && method !== "GET") headers.set("X-CSRFToken", csrfToken);
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Não foi possível comunicar com o backend.");
  return payload as T;
}

export function getBackendState() {
  return request<BackendState>("/api/state");
}

export function analyzeLink(link: string) {
  return request<{ status: string; metadata?: Record<string, unknown> }>("/analyze_link", {
    method: "POST",
    body: new URLSearchParams({ link }),
  });
}

export function addToQueue(link: string, format: string, title?: string) {
  return request<{ status: string }>("/api/add_to_queue", {
    method: "POST",
    body: new URLSearchParams({ link, format, ...(title ? { title } : {}) }),
  });
}

export function setQueuePaused(paused: boolean) {
  return request<{ paused: boolean }>("/api/pause_queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paused }),
  });
}

export function cancelTask(id: number, status: string) {
  return request<{ status: string }>("/api/cancel_task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, status }),
  });
}

export function loginWrapper(email: string, password: string) {
  return request<{ status: string }>("/login_wrapper", {
    method: "POST",
    body: new URLSearchParams({ email, password }),
  });
}

export function submitTwoFactor(code: string) {
  return request<{ status: string }>("/submit_2fa", {
    method: "POST",
    body: new URLSearchParams({ twofa_code: code }),
  });
}

export function stopWrapper() {
  return request<{ status: string }>("/stop_wrapper", { method: "POST" });
}

export function getConfig() {
  return request<{ status: string; config: Record<string, unknown> }>("/get_config");
}

export function saveConfig(config: Record<string, unknown>) {
  return request<{ status: string }>("/save_config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}
