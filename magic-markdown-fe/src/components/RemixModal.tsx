import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Filters } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SEASONS = ["Xuân", "Hè", "Thu", "Đông"];
const BODY = ["Gầy", "Trung bình", "Mũm mĩm"];
const CLOTHES = ["Áo", "Quần", "Váy", "Set"];
const STYLES = ["Minimalist", "Bohemian", "Streetwear", "Luxury", "Vintage"];
const BUDGETS = ["Low", "Mid", "High"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Filters;
  onApply: (f: Partial<Filters>) => void;
}

export function RemixModal({ open, onOpenChange, initial, onApply }: Props) {
  const [draft, setDraft] = useState<Partial<Filters>>({
    season: initial.season,
    bodyType: initial.bodyType,
    clothesType: initial.clothesType,
    stylePref: initial.stylePref,
    budget: initial.budget,
  });

  const update = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function randomize() {
    setDraft({
      season: pick(SEASONS) as Filters["season"],
      bodyType: pick(BODY) as Filters["bodyType"],
      clothesType: pick(CLOTHES) as Filters["clothesType"],
      stylePref: pick(STYLES) as Filters["stylePref"],
      budget: pick(BUDGETS) as Filters["budget"],
    });
  }

  function row(label: string, value: string, options: string[], k: keyof Filters) {
    return (
      <div className="grid grid-cols-3 items-center gap-3">
        <div className="tracking-label text-muted-foreground">{label}</div>
        <div className="col-span-2">
          <Select
            value={value || "__none__"}
            onValueChange={(v) => update(k, (v === "__none__" ? "" : v) as Filters[typeof k])}
          >
            <SelectTrigger className="rounded-none border-0 border-b border-border bg-transparent px-0 font-serif">
              <SelectValue placeholder="Không chọn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Không chọn</SelectItem>
              {options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-ivory border-gold/40">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl italic">Remix outfit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {row("Mùa", (draft.season as string) || "", SEASONS, "season")}
          {row("Thể trạng", (draft.bodyType as string) || "", BODY, "bodyType")}
          {row("Loại", (draft.clothesType as string) || "", CLOTHES, "clothesType")}
          {row("Style", (draft.stylePref as string) || "", STYLES, "stylePref")}
          {row("Ngân sách", (draft.budget as string) || "", BUDGETS, "budget")}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={randomize}
            className="rounded-full border-gold text-gold hover:bg-gold hover:text-ivory"
          >
            Remix ngẫu nhiên
          </Button>
          <Button
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
            className="rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
          >
            Áp dụng & Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
