import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE) {
  throw new Error("Missing VITE_API_BASE_URL. See .env.example.");
}

export class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

const ACTIVE_ORG_KEY = "docpilot:active_org_id";

export const getActiveOrgId = (): string | null =>
  localStorage.getItem(ACTIVE_ORG_KEY);

export const setActiveOrgId = (id: string | null) => {
  if (id) localStorage.setItem(ACTIVE_ORG_KEY, id);
  else localStorage.removeItem(ACTIVE_ORG_KEY);
};

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  /** If true, do NOT attach X-Org-Id. Default false (attaches if available). */
  skipOrgHeader?: boolean;
  /** If true, do NOT attach Authorization. Use for /signup-org and /by-token. */
  skipAuth?: boolean;
}

async function buildAuthHeaders(opts: {
  skipAuth?: boolean;
  skipOrgHeader?: boolean;
}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (!opts.skipAuth) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  if (!opts.skipOrgHeader) {
    const orgId = getActiveOrgId();
    if (orgId) headers["X-Org-Id"] = orgId;
  }
  return headers;
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers();
  if (!opts.formData) headers.set("Content-Type", "application/json");
  for (const [k, v] of Object.entries(await buildAuthHeaders(opts))) {
    headers.set(k, v);
  }
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.formData
      ? opts.formData
      : opts.body !== undefined
      ? JSON.stringify(opts.body)
      : undefined,
  });

  if (res.status === 204) return undefined as T;

  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const detail =
      (payload as { detail?: string } | null)?.detail ??
      (typeof payload === "string" ? payload : `Request failed (${res.status})`);
    throw new ApiError(res.status, detail);
  }

  return payload as T;
}

/**
 * Multipart upload with progress reporting. Uses XHR because fetch() doesn't
 * expose upload-side progress events. Returns the parsed JSON response.
 */
export async function uploadFile<T>(
  path: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
  opts: { skipOrgHeader?: boolean; skipAuth?: boolean } = {}
): Promise<T> {
  const authHeaders = await buildAuthHeaders(opts);
  const url = `${API_BASE}${path}`;

  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    for (const [k, v] of Object.entries(authHeaders)) {
      xhr.setRequestHeader(k, v);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      const text = xhr.responseText;
      let payload: unknown = null;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as T);
      } else {
        const detail =
          (payload as { detail?: string } | null)?.detail ??
          (typeof payload === "string" ? payload : `Upload failed (${xhr.status})`);
        reject(new ApiError(xhr.status, detail));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error during upload."));
    xhr.onabort = () => reject(new ApiError(0, "Upload was cancelled."));
    xhr.send(formData);
  });
}
