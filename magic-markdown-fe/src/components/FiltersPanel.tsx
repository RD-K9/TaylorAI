import { useFashion } from "@/lib/state";
import type { Filters } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function PillGroup<T extends string>({
  value,
  options,
  onChange,
  allowDeselect = true,
}: {
  value: T | "";
  options: readonly T[];
  onChange: (v: T | "") => void;
  allowDeselect?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active && allowDeselect ? "" : opt)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs tracking-wider uppercase transition-colors",
              active
                ? "border-charcoal bg-charcoal text-ivory"
                : "border-border text-charcoal hover:border-gold hover:text-gold"
            )}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function SelectField({
  value,
  options,
  onChange,
  placeholder = "Không chọn",
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
      <SelectTrigger className="rounded-none border-0 border-b border-border bg-transparent px-0 font-serif text-base focus:ring-0 focus-visible:ring-0 hover:border-gold">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="tracking-label text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

export function FiltersPanel() {
  const { filters, setFilters, generateCount, setGenerateCount } = useFashion();

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters({ ...filters, [k]: v });

  return (
    <div className="space-y-6">
      <Field label="Mùa *">
        <PillGroup
          value={filters.season}
          options={["Xuân", "Hè", "Thu", "Đông"] as const}
          onChange={(v) => set("season", v as Filters["season"])}
          allowDeselect={false}
        />
      </Field>

      <Field label="Loại quần áo *">
        <PillGroup
          value={filters.clothesType}
          options={["Áo", "Quần", "Váy", "Set"] as const}
          onChange={(v) => set("clothesType", v as Filters["clothesType"])}
          allowDeselect={false}
        />
      </Field>

      <Field label="Thể trạng">
        <PillGroup
          value={filters.bodyType}
          options={["Gầy", "Trung bình", "Mũm mĩm"] as const}
          onChange={(v) => set("bodyType", v as Filters["bodyType"])}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
        <Field label="Body type">
          <SelectField
            value={filters.bodyShape}
            options={["Pear", "Apple", "Hourglass", "Rectangle", "Triangle"]}
            onChange={(v) => set("bodyShape", v as Filters["bodyShape"])}
          />
        </Field>
        <Field label="Mục đích">
          <SelectField
            value={filters.occasion}
            options={["Đi tiệc", "Đi chơi", "Đi làm", "Đi học", "Thể thao"]}
            onChange={(v) => set("occasion", v as Filters["occasion"])}
          />
        </Field>
        <Field label="Style">
          <SelectField
            value={filters.stylePref}
            options={["Minimalist", "Bohemian", "Streetwear", "Luxury", "Vintage"]}
            onChange={(v) => set("stylePref", v as Filters["stylePref"])}
          />
        </Field>
        <Field label="Ngân sách">
          <SelectField
            value={filters.budget}
            options={["Low", "Mid", "High"]}
            onChange={(v) => set("budget", v as Filters["budget"])}
          />
        </Field>
        <Field label="Vùng địa lý">
          <SelectField
            value={filters.region}
            options={["Việt Nam", "Châu Á", "Châu Âu", "Mỹ"]}
            onChange={(v) => set("region", v as Filters["region"])}
          />
        </Field>
        <Field label="Fit">
          <SelectField
            value={filters.fitPref}
            options={["Slim fit", "Regular fit", "Loose fit"]}
            onChange={(v) => set("fitPref", v as Filters["fitPref"])}
          />
        </Field>
      </div>

      <Field label="Số lượng outfit">
        <PillGroup
          value={String(generateCount) as "1" | "3" | "5" | "10"}
          options={["1", "3", "5", "10"] as const}
          onChange={(v) => setGenerateCount((Number(v) || 1) as 1 | 3 | 5 | 10)}
          allowDeselect={false}
        />
      </Field>

      {filters.fitPref === "Slim fit" && filters.bodyType === "Mũm mĩm" && (
        <p className="text-xs text-burgundy italic border-l-2 border-burgundy pl-3">
          Có thể không thoải mái với Slim fit — thử Regular fit.
        </p>
      )}
      {generateCount === 10 && (
        <p className="text-xs text-muted-foreground italic border-l-2 border-gold pl-3">
          10 ảnh sẽ mất nhiều thời gian và tốn pollen.
        </p>
      )}
    </div>
  );
}
