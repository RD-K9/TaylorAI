import { useEffect, useState } from "react";
import { health } from "@/lib/fashionApi";

export function BackendStatus() {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    health()
      .then((r) => {
        if (!cancelled) setOk(r.status === "ok");
      })
      .catch(() => {
        if (!cancelled) setOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (ok === null) return null;

  return (
    <p
      className={`text-xs tracking-wide mt-3 ${ok ? "text-emerald-700" : "text-red-600"}`}
      title={ok ? "Backend Flask đang chạy" : "Không kết nối được backend — chạy python server.py trong fashion-app/backend"}
    >
      {ok ? "● Backend kết nối OK" : "● Backend chưa chạy (port 3000)"}
    </p>
  );
}
