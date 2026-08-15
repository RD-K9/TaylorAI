import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { toastApiError, logApiSuccess } from "@/components/AiLogActions";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sparkles, Settings2, ArrowLeft, AlertTriangle, Bookmark, Shirt } from "lucide-react";

import { FashionProvider, useFashion } from "@/lib/state";
import {
  validateFabric,
  generateGarment,
  tryOn as apiTryOn,
} from "@/lib/fashionApi";
import { base64ToBlobUrl, uploadedFromDataUrl } from "@/lib/imageUtils";
import type { Garment, UploadedImage } from "@/lib/types";
import type { WardrobeGarment } from "@/lib/wardrobeDb";
import { useWardrobe } from "@/hooks/useWardrobe";

import { StepIndicator } from "@/components/StepIndicator";
import { UploadZone } from "@/components/UploadZone";
import { FiltersPanel } from "@/components/FiltersPanel";
import { MeasurementsPanel } from "@/components/MeasurementsPanel";
import { EditorialRule } from "@/components/EditorialRule";
import { GarmentCard } from "@/components/GarmentCard";
import { RemixModal } from "@/components/RemixModal";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { TryOnResult } from "@/components/TryOnResult";
import { BackendStatus } from "@/components/BackendStatus";
import { WardrobePicker } from "@/components/WardrobePicker";

function garmentFromWardrobe(g: WardrobeGarment): Garment {
  return {
    id: `wardrobe-${g.id}`,
    imageUrl: `data:image/jpeg;base64,${g.imageBase64}`,
    imageBase64: g.imageBase64,
    prompt: g.prompt || "",
    seed: 0,
    stylePref: "",
    budget: "",
    feedback: null,
    source: "wardrobe",
  };
}

function garmentFromUpload(img: UploadedImage): Garment {
  return {
    id: `uploaded-${Date.now()}`,
    imageUrl: img.dataUrl,
    imageBase64: img.base64,
    prompt: "",
    seed: 0,
    stylePref: "",
    budget: "",
    feedback: null,
    source: "uploaded",
  };
}

async function toastSave(action: () => Promise<unknown>, okMessage: string) {
  try {
    await action();
    toast.success(okMessage);
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Không lưu được");
  }
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Thiết kế quần áo" },
      { name: "description", content: "Phong cách dành riêng cho bạn — thiết kế trang phục từ ảnh người." },
    ],
  }),
  component: () => (
    <FashionProvider>
      <App />
      <Toaster position="top-center" />
    </FashionProvider>
  ),
});

function App() {
  const { step } = useFashion();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <StepIndicator current={step} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pb-24">
        {step === "input" || step === "processing" ? <InputView /> : null}
        {(step === "preview" || step === "feedback") && <PreviewView />}
        {(step === "tryon" || step === "done") && <TryOnView />}
      </main>
      <Overlays />
    </div>
  );
}

function Header() {
  const s = useFashion();
  const [wardrobeOpen, setWardrobeOpen] = useState(false);

  return (
    <header className="border-b border-border/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 py-8 text-center">
        <p className="tracking-label text-gold">Atelier · Lookbook</p>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl italic mt-2 text-charcoal">
          Thiết kế quần áo
        </h1>
        <p className="font-serif italic text-muted-foreground mt-2">
          Phong cách dành riêng cho bạn
        </p>
        <BackendStatus />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory"
            onClick={() => setWardrobeOpen(true)}
          >
            <Bookmark className="h-4 w-4 mr-1" /> Tủ đồ
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-gold text-gold hover:bg-gold hover:text-ivory"
            onClick={() => {
              s.clearTryOn();
              s.setStep("tryon");
            }}
          >
            <Shirt className="h-4 w-4 mr-1" /> Thử đồ có sẵn
          </Button>
        </div>
      </div>
      <WardrobePicker
        open={wardrobeOpen}
        onOpenChange={setWardrobeOpen}
        mode="browse"
        onPickPerson={(p) => {
          s.setPersonImage(uploadedFromDataUrl(p.dataUrl));
          s.clearTryOn();
          setWardrobeOpen(false);
          toast.success("Đã chọn ảnh người từ tủ đồ");
        }}
        onPickGarment={(g) => {
          s.applySessionGarment(garmentFromWardrobe(g));
          s.clearTryOn();
          s.setStep("tryon");
          setWardrobeOpen(false);
          toast.success("Đã chọn quần áo từ tủ đồ");
        }}
      />
    </header>
  );
}

function Overlays() {
  const { status, progress } = useFashion();
  if (status === "validating") return <LoadingOverlay message="Đang kiểm tra chất liệu vải..." />;
  if (status === "generating")
    return (
      <LoadingOverlay
        message={`Đang generate ${progress.current}/${progress.total}...`}
      />
    );
  return null;
}

/* ---------- INPUT VIEW ---------- */

function InputView() {
  const s = useFashion();
  const wardrobe = useWardrobe();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [personPickerOpen, setPersonPickerOpen] = useState(false);

  const missing = useMemo(() => {
    const arr: string[] = [];
    if (!s.personImage) arr.push("Ảnh người");
    if (!s.filters.season) arr.push("Mùa");
    if (!s.filters.clothesType) arr.push("Loại quần áo");
    return arr;
  }, [s.personImage, s.filters.season, s.filters.clothesType]);

  const canGenerate = missing.length === 0;

  async function handleGenerate() {
    if (!canGenerate || !s.personImage) return;

    // Fabric validation
    if (s.fabricImage && !s.fabricValidation) {
      s.setStatus("validating");
      try {
        const v = await validateFabric({
          fabricImageBase64: s.fabricImage.base64,
          clothesType: s.filters.clothesType,
          season: s.filters.season,
          occasion: s.filters.occasion || undefined,
        });
        s.setFabricValidation(v);
        logApiSuccess("validate-fabric", v.debugLog);
        if (!v.compatible) {
          s.setStatus("awaiting_fabric_confirm");
          toast.warning(v.message_vi);
          return;
        }
      } catch (e) {
        s.setStatus("idle");
        toastApiError(e, "Lỗi kiểm tra vải");
        return;
      }
    }

    await runGenerate();
  }

  async function runGenerate() {
    if (!s.personImage) return;
    s.clearTryOn();
    s.setSelectedGarmentId(null);
    s.setStatus("generating");
    s.setStep("processing");
    s.setGarments([]);
    s.setProgress({ current: 0, total: s.generateCount });

    for (let i = 0; i < s.generateCount; i++) {
      s.setProgress({ current: i + 1, total: s.generateCount });
      const seed = Date.now() + i * 997;
      try {
        const cleanMeasurements = Object.fromEntries(
          Object.entries(s.measurements).filter(([, v]) => v != null && v !== ("" as unknown as number))
        );
        const res = await generateGarment({
          filters: s.filters as Required<typeof s.filters>,
          context: {
            personImageBase64: s.personImage.base64,
            fabricImageBase64: s.fabricImage?.base64,
            referenceImageBase64: s.referenceImage?.base64,
            bodyMeasurements: Object.keys(cleanMeasurements).length ? cleanMeasurements : undefined,
          },
          options: { seed, width: 1024, height: 1024 },
        });
        const url = base64ToBlobUrl(res.image);
        logApiSuccess("generate-garment", res.debugLog);
        s.setGarments((prev) => [
          ...prev,
          {
            id: `${seed}`,
            imageUrl: url,
            imageBase64: res.image,
            prompt: res.prompt,
            seed: res.seed,
            stylePref: s.filters.stylePref,
            budget: s.filters.budget,
            feedback: null,
            source: "generated",
          },
        ]);
      } catch (e) {
        toastApiError(e, "Lỗi tạo outfit");
      }
    }

    s.setStatus("done");
    s.setStep("preview");
    toast.success("Đã tạo xong outfit!");
  }

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-10 mt-6">
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:block space-y-8">
        <SidebarContent />
      </aside>

      {/* Main */}
      <section className="space-y-8">
        <div>
          <EditorialRule>Editorial No. 01</EditorialRule>
          <UploadZone
            label="Ảnh người"
            required
            value={s.personImage}
            onChange={s.setPersonImage}
            large
            showSave
            saveLabel="Lưu ảnh người"
            saved={wardrobe.isPersonSaved(s.personImage?.dataUrl)}
            onSave={() => {
              if (!s.personImage) return;
              void toastSave(() => wardrobe.savePerson(s.personImage!.dataUrl), "Đã lưu ảnh người");
            }}
            showWardrobe
            onPickWardrobe={() => setPersonPickerOpen(true)}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <UploadZone
            label="Chất liệu vải (Tùy chọn)"
            hint="Không upload vẫn generate bình thường"
            value={s.fabricImage}
            onChange={(v) => {
              s.setFabricImage(v);
              s.setFabricValidation(null);
            }}
          />
          <UploadZone
            label="Ảnh mẫu (Tùy chọn)"
            value={s.referenceImage}
            onChange={s.setReferenceImage}
          />
        </div>

        {s.fabricValidation && !s.fabricValidation.compatible && (
          <div className="border border-gold/60 bg-gold/5 p-4 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-gold shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <div className="tracking-label text-gold">Cảnh báo chất liệu</div>
                <p className="font-serif italic text-charcoal mt-1">{s.fabricValidation.message_vi}</p>
              </div>
              <Button
                size="sm"
                onClick={runGenerate}
                className="rounded-full bg-gold text-ivory hover:bg-gold/90"
              >
                Tiếp tục generate
              </Button>
            </div>
          </div>
        )}

        {/* Mobile filters trigger */}
        <div className="lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="w-full rounded-full border-charcoal text-charcoal"
              >
                <Settings2 className="h-4 w-4 mr-2" /> Upload & Lọc
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-ivory w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="font-display italic text-2xl">Bảng tạo phong cách</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <SidebarContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="border-t border-border pt-6 flex flex-col items-center gap-3">
          <Button
            size="lg"
            disabled={!canGenerate || s.status !== "idle" && s.status !== "awaiting_fabric_confirm" && s.status !== "done"}
            onClick={handleGenerate}
            className="rounded-full px-10 py-6 text-xs tracking-[0.3em] uppercase bg-charcoal text-ivory hover:bg-burgundy"
            title={!canGenerate ? `Còn thiếu: ${missing.join(", ")}` : ""}
          >
            <Sparkles className="h-4 w-4 mr-2 text-gold" />
            Generate Quần Áo
          </Button>
          {!canGenerate && (
            <p className="text-xs text-muted-foreground italic">
              Còn thiếu: {missing.join(", ")}
            </p>
          )}
          <Button
            variant="outline"
            onClick={() => {
              s.clearTryOn();
              s.setStep("tryon");
            }}
            className="rounded-full border-gold text-gold hover:bg-gold hover:text-ivory"
          >
            <Shirt className="h-4 w-4 mr-2" /> Thử đồ có sẵn
          </Button>
        </div>
      </section>

      {/* Mobile FAB */}
      {canGenerate && (
        <button
          onClick={handleGenerate}
          className="lg:hidden fixed bottom-6 right-6 z-40 rounded-full bg-burgundy text-ivory h-14 w-14 shadow-xl flex items-center justify-center"
          aria-label="Tạo outfit"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}
      <WardrobePicker
        open={personPickerOpen}
        onOpenChange={setPersonPickerOpen}
        mode="person"
        onPickPerson={(p) => {
          s.setPersonImage(uploadedFromDataUrl(p.dataUrl));
          setPersonPickerOpen(false);
          toast.success("Đã chọn ảnh người từ tủ đồ");
        }}
      />
    </div>
  );
}

function SidebarContent() {
  return (
    <div className="space-y-8">
      <div>
        <EditorialRule>Bộ lọc</EditorialRule>
        <FiltersPanel />
      </div>
      <div>
        <EditorialRule>Dáng người (Tùy chọn)</EditorialRule>
        <MeasurementsPanel />
      </div>
    </div>
  );
}

/* ---------- PREVIEW VIEW ---------- */

function PreviewView() {
  const s = useFashion();
  const wardrobe = useWardrobe();
  const [remixOpen, setRemixOpen] = useState(false);
  const [remixTargetId, setRemixTargetId] = useState<string | null>(null);

  async function handleRemix(partial: Partial<typeof s.filters>) {
    s.setFilters({ ...s.filters, ...partial });
    s.clearTryOn();
    s.setStatus("generating");
    s.setProgress({ current: 1, total: 1 });
    try {
      if (!s.personImage) return;
      const seed = Date.now();
      const res = await generateGarment({
        filters: { ...s.filters, ...partial } as Required<typeof s.filters>,
        context: {
          personImageBase64: s.personImage.base64,
          fabricImageBase64: s.fabricImage?.base64,
          referenceImageBase64: s.referenceImage?.base64,
        },
        options: { seed, width: 1024, height: 1024 },
      });
      const url = base64ToBlobUrl(res.image);
      s.setGarments((prev) => {
        const next: typeof prev = [
          ...prev,
          {
            id: `${seed}`,
            imageUrl: url,
            imageBase64: res.image,
            prompt: res.prompt,
            seed: res.seed,
            stylePref: (partial.stylePref ?? s.filters.stylePref) as string,
            budget: (partial.budget ?? s.filters.budget) as string,
            feedback: null,
            source: "generated",
          },
        ];
        return remixTargetId ? next.filter((g) => g.id !== remixTargetId) : next;
      });
      toast.success("Đã remix outfit mới");
    } catch (e) {
      toastApiError(e, "Lỗi remix");
    } finally {
      s.setStatus("done");
      setRemixTargetId(null);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => {
            s.clearTryOn();
            s.setStep("input");
          }}
          className="text-charcoal hover:text-gold"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
        <div className="text-center">
          <EditorialRule>{s.step === "feedback" ? "Phản hồi" : "Lookbook"}</EditorialRule>
        </div>
        <Button
          disabled={!s.selectedGarmentId || s.step !== "feedback"}
          onClick={() => {
            s.clearTryOn();
            s.setStep("tryon");
          }}
          className="rounded-full bg-charcoal text-ivory hover:bg-burgundy"
        >
          Người Mặc Quần Áo
        </Button>
      </div>

      {s.garments.length === 0 ? (
        <p className="text-center text-muted-foreground italic py-20">
          Chưa có outfit. Hãy quay lại generate.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {s.garments.map((g) => (
            <GarmentCard
              key={g.id}
              garment={g}
              selected={s.selectedGarmentId === g.id}
              onSelect={() => {
                s.clearTryOn();
                s.setSelectedGarmentId(g.id);
                s.setStep("feedback");
              }}
              onFeedback={(f) =>
                s.setGarments((prev) =>
                  prev.map((x) => (x.id === g.id ? { ...x, feedback: f } : x))
                )
              }
              onRemix={() => {
                setRemixTargetId(g.id);
                setRemixOpen(true);
              }}
              onDelete={() => {
                s.setGarments((prev) => prev.filter((x) => x.id !== g.id));
                if (s.selectedGarmentId === g.id) {
                  s.setSelectedGarmentId(null);
                  s.clearTryOn();
                  s.setStep("preview");
                }
              }}
              saved={wardrobe.isGarmentSaved(g.imageBase64)}
              onSave={() =>
                void toastSave(
                  () =>
                    wardrobe.saveGarment({
                      imageBase64: g.imageBase64,
                      source: g.source === "uploaded" ? "uploaded" : "generated",
                      prompt: g.prompt,
                    }),
                  "Đã lưu quần áo vào tủ đồ"
                )
              }
            />
          ))}
        </div>
      )}

      {s.fabricImage && s.garments.length > 0 && (
        <div className="mt-12 space-y-4">
          <EditorialRule>So sánh chất liệu</EditorialRule>
          <div className="grid grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div>
              <div className="tracking-label text-muted-foreground mb-2">Vải gốc</div>
              <div className="frame-double">
                <img src={s.fabricImage.dataUrl} alt="Vải" className="w-full aspect-square object-cover" />
              </div>
            </div>
            <div>
              <div className="tracking-label text-muted-foreground mb-2">Outfit mới nhất</div>
              <div className="frame-double">
                <img
                  src={s.garments[s.garments.length - 1].imageUrl}
                  alt="Outfit"
                  className="w-full aspect-square object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <RemixModal
        open={remixOpen}
        onOpenChange={setRemixOpen}
        initial={s.filters}
        onApply={handleRemix}
      />
    </div>
  );
}

/* ---------- TRY-ON VIEW ---------- */

function TryOnView() {
  const s = useFashion();
  const wardrobe = useWardrobe();
  const garment = s.garments.find((g) => g.id === s.selectedGarmentId) ?? null;
  const [loading, setLoading] = useState(false);
  const [personPickerOpen, setPersonPickerOpen] = useState(false);
  const [garmentPickerOpen, setGarmentPickerOpen] = useState(false);
  const hasCachedResult =
    s.tryOnImage &&
    s.tryOnGarmentId === s.selectedGarmentId &&
    garment != null;
  const [result, setResult] = useState<string | null>(
    hasCachedResult ? s.tryOnImage : null
  );

  useEffect(() => {
    if (s.tryOnImage && s.tryOnGarmentId === s.selectedGarmentId) {
      setResult(s.tryOnImage);
    } else {
      setResult(null);
    }
  }, [s.selectedGarmentId, s.tryOnImage, s.tryOnGarmentId]);

  function goBack() {
    s.clearTryOn();
    setResult(null);
    if (s.garments.some((g) => g.source === "generated" || g.source == null)) {
      s.setStep(s.selectedGarmentId ? "feedback" : "preview");
    } else {
      s.setStep("input");
    }
  }

  async function run() {
    if (!s.personImage || !garment) return;
    setResult(null);
    s.clearTryOn();
    setLoading(true);
    try {
      const res = await apiTryOn({
        personImageBase64: s.personImage.base64,
        garmentImageBase64: garment.imageBase64,
      });
      setResult(res.image);
      s.setTryOnImage(res.image);
      s.setTryOnGarmentId(garment.id);
      s.setStep("done");
      toast.success("Hoàn tất thử đồ ảo");
    } catch (e) {
      toastApiError(e, "Lỗi thử đồ");
    } finally {
      setLoading(false);
    }
  }

  const garmentPreview: UploadedImage | null = garment
    ? { dataUrl: garment.imageUrl, base64: garment.imageBase64, width: 0, height: 0 }
    : null;

  return (
    <div className="mt-6 space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} className="text-charcoal hover:text-gold">
          <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
        </Button>
      </div>

      {result && s.personImage ? (
        <TryOnResult
          personImage={s.personImage}
          resultBase64={result}
          onReset={goBack}
        />
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          <EditorialRule>Thử đồ ảo</EditorialRule>
          <p className="text-center text-sm text-muted-foreground italic">
            Tải ảnh hoặc chọn từ tủ đồ. Ảnh gen chỉ lưu khi bạn bấm Lưu.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            <UploadZone
              label="Ảnh người"
              required
              value={s.personImage}
              onChange={(v) => {
                s.setPersonImage(v);
                s.clearTryOn();
              }}
              large
              showSave
              saveLabel="Lưu ảnh người"
              saved={wardrobe.isPersonSaved(s.personImage?.dataUrl)}
              onSave={() => {
                if (!s.personImage) return;
                void toastSave(() => wardrobe.savePerson(s.personImage!.dataUrl), "Đã lưu ảnh người");
              }}
              showWardrobe
              onPickWardrobe={() => setPersonPickerOpen(true)}
            />
            <UploadZone
              label="Ảnh quần áo"
              required
              hint="Upload ảnh có sẵn hoặc chọn outfit đã lưu"
              value={garmentPreview}
              onChange={(v) => {
                if (!v) {
                  if (garment && garment.source !== "generated") {
                    s.setGarments((prev) => prev.filter((x) => x.id !== garment.id));
                  }
                  s.setSelectedGarmentId(null);
                  s.clearTryOn();
                  return;
                }
                s.applySessionGarment(garmentFromUpload(v));
              }}
              large
              showSave
              saveLabel="Lưu quần áo"
              saved={wardrobe.isGarmentSaved(garment?.imageBase64)}
              onSave={() => {
                if (!garment) return;
                void toastSave(
                  () =>
                    wardrobe.saveGarment({
                      imageBase64: garment.imageBase64,
                      source: garment.source === "uploaded" ? "uploaded" : "generated",
                      prompt: garment.prompt,
                    }),
                  "Đã lưu quần áo vào tủ đồ"
                );
              }}
              showWardrobe
              onPickWardrobe={() => setGarmentPickerOpen(true)}
            />
          </div>
          <div className="text-center">
            <Button
              size="lg"
              onClick={run}
              disabled={loading || !s.personImage || !garment}
              className="rounded-full bg-burgundy text-ivory hover:bg-burgundy/90 px-10 tracking-[0.3em] uppercase text-xs"
            >
              {loading ? "Đang thử đồ ảo..." : "Bắt đầu thử đồ"}
            </Button>
            {(!s.personImage || !garment) && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                Cần đủ ảnh người và ảnh quần áo
              </p>
            )}
          </div>
        </div>
      )}

      <WardrobePicker
        open={personPickerOpen}
        onOpenChange={setPersonPickerOpen}
        mode="person"
        onPickPerson={(p) => {
          s.setPersonImage(uploadedFromDataUrl(p.dataUrl));
          s.clearTryOn();
          setPersonPickerOpen(false);
        }}
      />
      <WardrobePicker
        open={garmentPickerOpen}
        onOpenChange={setGarmentPickerOpen}
        mode="garment"
        onPickGarment={(g) => {
          s.applySessionGarment(garmentFromWardrobe(g));
          setGarmentPickerOpen(false);
        }}
      />

      {loading && <LoadingOverlay message="Đang thử đồ ảo..." />}
    </div>
  );
}
