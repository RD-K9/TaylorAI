import { cn } from "@/lib/utils";

const STEPS = [
  { id: "input", label: "Nhập liệu" },
  { id: "processing", label: "Xử lý AI" },
  { id: "preview", label: "Xem trước" },
  { id: "feedback", label: "Phản hồi" },
  { id: "tryon", label: "Thử đồ" },
] as const;

export function StepIndicator({ current }: { current: string }) {
  const activeIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 py-4 flex-wrap">
      {STEPS.map((s, i) => {
        const active = i === activeIdx;
        const done = i < activeIdx;
        return (
          <div key={s.id} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium transition-colors",
                  active && "border-gold bg-gold text-ivory",
                  done && "border-charcoal bg-charcoal text-ivory",
                  !active && !done && "border-border text-muted-foreground"
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "tracking-label",
                  active ? "text-charcoal" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="h-px w-6 sm:w-10 bg-border" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
