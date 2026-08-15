export type Season = "Xuân" | "Hè" | "Thu" | "Đông";
export type BodyConstitution = "Gầy" | "Trung bình" | "Mũm mĩm";
export type BodyShape = "Pear" | "Apple" | "Hourglass" | "Rectangle" | "Triangle";
export type ClothesType = "Áo" | "Quần" | "Váy" | "Set";
export type Occasion = "Đi tiệc" | "Đi chơi" | "Đi làm" | "Đi học" | "Thể thao";
export type StylePref = "Minimalist" | "Bohemian" | "Streetwear" | "Luxury" | "Vintage";
export type Budget = "Low" | "Mid" | "High";
export type Region = "Việt Nam" | "Châu Á" | "Châu Âu" | "Mỹ";
export type FitPref = "Slim fit" | "Regular fit" | "Loose fit";

export interface Filters {
  season: Season | "";
  bodyType: BodyConstitution | "";
  bodyShape: BodyShape | "";
  clothesType: ClothesType | "";
  occasion: Occasion | "";
  stylePref: StylePref | "";
  budget: Budget | "";
  region: Region | "";
  fitPref: FitPref | "";
}

export interface BodyMeasurements {
  height?: number;
  bust?: number;
  waist?: number;
  hips?: number;
}

export interface UploadedImage {
  dataUrl: string;
  base64: string;
  width: number;
  height: number;
}

export type GarmentSource = "generated" | "uploaded" | "wardrobe";

export interface Garment {
  id: string;
  imageUrl: string;
  imageBase64: string;
  prompt: string;
  seed: number;
  stylePref: string;
  budget: string;
  feedback: "like" | "dislike" | null;
  source?: GarmentSource;
}

export type GenerateCount = 1 | 3 | 5 | 10;

export type Step = "input" | "processing" | "preview" | "feedback" | "tryon" | "done";

export type GenerateStatus =
  | "idle"
  | "validating"
  | "generating"
  | "awaiting_fabric_confirm"
  | "done";
