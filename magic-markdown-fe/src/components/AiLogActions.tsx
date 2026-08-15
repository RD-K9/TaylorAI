import { toast } from "sonner";
import type { AiLogEntry, FashionApiError } from "@/lib/fashionApi";
import { copyAiLogs, downloadAiLogs, reportApiError } from "@/lib/aiLogUtils";

function isFashionApiError(err: unknown): err is FashionApiError {
  return err instanceof Error && err.name === "FashionApiError";
}

export function toastApiError(err: unknown, fallback = "Có lỗi xảy ra") {
  const { message, logs, logText } = reportApiError(err);
  const hasLogs = Boolean(logs.length || logText);

  toast.error(isFashionApiError(err) ? err.message : message || fallback, {
    description: hasLogs
      ? "API AI không trả kết quả hoặc lỗi — dùng Copy log / Tải log bên dưới"
      : undefined,
    duration: 15000,
    action: hasLogs
      ? {
          label: "Copy log",
          onClick: () => {
            void copyAiLogs(logs, logText).then((ok) => {
              toast.info(ok ? "Đã copy log AI vào clipboard" : "Không copy được");
            });
          },
        }
      : undefined,
    cancel: hasLogs
      ? {
          label: "Tải log",
          onClick: () => {
            downloadAiLogs(logs, logText);
            toast.info("Đã tải file log");
          },
        }
      : undefined,
  });
}

export function logApiSuccess(label: string, debugLog?: AiLogEntry[]) {
  if (debugLog?.length) {
    console.info(`[${label}] AI debugLog`, debugLog);
  }
}
