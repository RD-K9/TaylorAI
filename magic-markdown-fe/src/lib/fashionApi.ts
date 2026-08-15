import type { Filters, BodyMeasurements } from "./types";

/** Empty string = same-origin via Vite proxy (/api → localhost:3000) */
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export interface AiLogEntry {
  ts: string;
  service: string;
  action: string;
  method?: string;
  url?: string;
  statusCode?: number;
  response?: string;
  error?: string;
  durationMs?: number;
  request?: Record<string, unknown>;
  extra?: Record<string, unknown>;
}

export class FashionApiError extends Error {
  code: string;
  status: number;
  debugLog: AiLogEntry[];
  debugLogText: string;

  constructor(
    message: string,
    code = "NETWORK",
    status = 0,
    debugLog: AiLogEntry[] = [],
    debugLogText = ""
  ) {
    super(message);
    this.name = "FashionApiError";
    this.code = code;
    this.status = status;
    this.debugLog = debugLog;
    this.debugLogText = debugLogText;
  }
}

async function request<T>(path: string, body: unknown, timeoutMs = 120000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => ({}));
    const debugLog = (json?.debugLog as AiLogEntry[]) || [];
    const debugLogText = (json?.debugLogText as string) || "";

    if (!res.ok) {
      const code = json?.error?.code || "NETWORK";
      const message = json?.error?.message || `Lỗi ${res.status}`;
      throw new FashionApiError(message, code, res.status, debugLog, debugLogText);
    }
    return json as T;
  } catch (err) {
    if (err instanceof FashionApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new FashionApiError("Yêu cầu quá thời gian chờ.", "TIMEOUT", 408);
    }
    throw new FashionApiError(
      err instanceof Error ? err.message : "Lỗi kết nối máy chủ",
      "NETWORK",
      0
    );
  } finally {
    clearTimeout(t);
  }
}

export async function health(): Promise<{ status: string }> {
  const res = await fetch(`${BASE}/api/health`);
  return res.json();
}

export async function fetchAiLogs(limit = 50): Promise<{ logs: AiLogEntry[]; logText: string }> {
  const res = await fetch(`${BASE}/api/ai-logs?limit=${limit}`);
  return res.json();
}

export interface FabricValidationResponse {
  fabric_type: string;
  compatible: boolean;
  message_vi: string;
  debugLog?: AiLogEntry[];
  debugLogText?: string;
}

export function validateFabric(input: {
  fabricImageBase64: string;
  clothesType: string;
  season: string;
  occasion?: string;
}): Promise<FabricValidationResponse> {
  return request("/api/validate-fabric", input, 60000);
}

export interface GenerateGarmentResponse {
  image: string;
  prompt: string;
  seed: number;
  meta: { model: string; durationMs: number };
  debugLog?: AiLogEntry[];
}

export function generateGarment(input: {
  filters: Filters;
  context: {
    personImageBase64: string;
    fabricImageBase64?: string;
    referenceImageBase64?: string;
    bodyMeasurements?: Partial<BodyMeasurements>;
  };
  options: { seed: number; width: number; height: number };
}): Promise<GenerateGarmentResponse> {
  return request("/api/generate-garment", input, 120000);
}

export interface TryOnResponse {
  image: string;
  meta: { space: string; durationMs: number };
  debugLog?: AiLogEntry[];
}

export function tryOn(input: {
  personImageBase64: string;
  garmentImageBase64: string;
}): Promise<TryOnResponse> {
  return request("/api/try-on", input, 180000);
}
