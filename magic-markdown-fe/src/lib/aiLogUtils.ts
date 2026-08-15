import type { AiLogEntry } from "./fashionApi";

export function formatAiLogs(logs: AiLogEntry[] | undefined, logText?: string): string {
  if (logText) return logText;
  if (!logs?.length) return "(không có log AI)";
  return JSON.stringify(logs, null, 2);
}

export async function copyAiLogs(logs: AiLogEntry[] | undefined, logText?: string): Promise<boolean> {
  const text = formatAiLogs(logs, logText);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadAiLogs(logs: AiLogEntry[] | undefined, logText?: string, filename?: string) {
  const text = formatAiLogs(logs, logText);
  const name = filename || `ai-log-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function reportApiError(err: unknown): { message: string; logs: AiLogEntry[]; logText: string } {
  if (err instanceof Error && err.name === "FashionApiError") {
    const e = err as import("./fashionApi").FashionApiError;
    console.error("[AI API error]", e.message, e.debugLogText || e.debugLog);
    return {
      message: e.message,
      logs: e.debugLog ?? [],
      logText: e.debugLogText ?? "",
    };
  }
  const message = err instanceof Error ? err.message : "Lỗi không xác định";
  console.error("[API error]", message, err);
  return { message, logs: [], logText: "" };
}
