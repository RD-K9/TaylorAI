import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Filters,
  BodyMeasurements,
  UploadedImage,
  Garment,
  GenerateCount,
  Step,
  GenerateStatus,
} from "./types";

const DRAFT_KEY = "fashion_draft_v1";

const emptyFilters: Filters = {
  season: "",
  bodyType: "",
  bodyShape: "",
  clothesType: "",
  occasion: "",
  stylePref: "",
  budget: "",
  region: "",
  fitPref: "",
};

interface FashionState {
  step: Step;
  setStep: (s: Step) => void;
  personImage: UploadedImage | null;
  setPersonImage: (i: UploadedImage | null) => void;
  fabricImage: UploadedImage | null;
  setFabricImage: (i: UploadedImage | null) => void;
  referenceImage: UploadedImage | null;
  setReferenceImage: (i: UploadedImage | null) => void;
  measurements: BodyMeasurements;
  setMeasurements: (m: BodyMeasurements) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  generateCount: GenerateCount;
  setGenerateCount: (n: GenerateCount) => void;
  garments: Garment[];
  setGarments: (g: Garment[] | ((prev: Garment[]) => Garment[])) => void;
  selectedGarmentId: string | null;
  setSelectedGarmentId: (id: string | null) => void;
  status: GenerateStatus;
  setStatus: (s: GenerateStatus) => void;
  progress: { current: number; total: number };
  setProgress: (p: { current: number; total: number }) => void;
  fabricValidation: { compatible: boolean; message_vi: string; fabric_type: string } | null;
  setFabricValidation: (v: FashionState["fabricValidation"]) => void;
  tryOnImage: string | null;
  setTryOnImage: (b64: string | null) => void;
  tryOnGarmentId: string | null;
  setTryOnGarmentId: (id: string | null) => void;
  applySessionGarment: (g: Garment) => void;
  resetAll: () => void;
  clearTryOn: () => void;
}

const Ctx = createContext<FashionState | null>(null);

export function FashionProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<Step>("input");
  const [personImage, setPersonImage] = useState<UploadedImage | null>(null);
  const [fabricImage, setFabricImage] = useState<UploadedImage | null>(null);
  const [referenceImage, setReferenceImage] = useState<UploadedImage | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurements>({});
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [generateCount, setGenerateCount] = useState<GenerateCount>(1);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [fabricValidation, setFabricValidation] = useState<FashionState["fabricValidation"]>(null);
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [tryOnGarmentId, setTryOnGarmentId] = useState<string | null>(null);

  const clearTryOn = () => {
    setTryOnImage(null);
    setTryOnGarmentId(null);
  };

  // Load draft
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const j = JSON.parse(raw);
        if (j.filters) setFilters({ ...emptyFilters, ...j.filters });
        if (j.generateCount) setGenerateCount(j.generateCount);
      }
    } catch {}
  }, []);

  // Save draft
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ filters, generateCount }));
    } catch {}
  }, [filters, generateCount]);

  const applySessionGarment = (g: Garment) => {
    setGarments((prev) => (prev.some((x) => x.id === g.id) ? prev : [...prev, g]));
    setSelectedGarmentId(g.id);
    setTryOnImage(null);
    setTryOnGarmentId(null);
  };

  const value = useMemo<FashionState>(
    () => ({
      step,
      setStep,
      personImage,
      setPersonImage,
      fabricImage,
      setFabricImage,
      referenceImage,
      setReferenceImage,
      measurements,
      setMeasurements,
      filters,
      setFilters,
      generateCount,
      setGenerateCount,
      garments,
      setGarments,
      selectedGarmentId,
      setSelectedGarmentId,
      status,
      setStatus,
      progress,
      setProgress,
      fabricValidation,
      setFabricValidation,
      tryOnImage,
      setTryOnImage,
      tryOnGarmentId,
      setTryOnGarmentId,
      applySessionGarment,
      resetAll: () => {
        setStep("input");
        setGarments([]);
        setSelectedGarmentId(null);
        setStatus("idle");
        setProgress({ current: 0, total: 0 });
        setFabricValidation(null);
        clearTryOn();
      },
      clearTryOn,
    }),
    [
      step,
      personImage,
      fabricImage,
      referenceImage,
      measurements,
      filters,
      generateCount,
      garments,
      selectedGarmentId,
      status,
      progress,
      fabricValidation,
      tryOnImage,
      tryOnGarmentId,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFashion(): FashionState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFashion must be inside FashionProvider");
  return v;
}
