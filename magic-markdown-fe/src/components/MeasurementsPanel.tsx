import { useFashion } from "@/lib/state";

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (n: number | undefined) => void;
}) {
  return (
    <label className="space-y-1.5 block">
      <span className="tracking-label text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? undefined : Number(v));
        }}
        className="w-full bg-transparent border-0 border-b border-border focus:border-gold outline-none font-serif text-lg py-1"
        placeholder="—"
      />
    </label>
  );
}

export function MeasurementsPanel() {
  const { measurements, setMeasurements } = useFashion();
  const m = measurements;
  const set = (k: keyof typeof m) => (v: number | undefined) =>
    setMeasurements({ ...m, [k]: v });

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      <NumInput label="Chiều cao (cm)" value={m.height} onChange={set("height")} />
      <NumInput label="Ngực (cm)" value={m.bust} onChange={set("bust")} />
      <NumInput label="Eo (cm)" value={m.waist} onChange={set("waist")} />
      <NumInput label="Mông (cm)" value={m.hips} onChange={set("hips")} />
    </div>
  );
}
