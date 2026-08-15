import type { UploadedImage } from "./types";

export const MAX_BYTES = 10 * 1024 * 1024;
export const MIN_SHORT_EDGE = 512;
export const MAX_LONG_EDGE = 1536;

export function stripBase64Prefix(s: string): string {
  return s.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
}

export function uploadedFromDataUrl(dataUrl: string): UploadedImage {
  return { dataUrl, base64: stripBase64Prefix(dataUrl), width: 0, height: 0 };
}

export function uploadedFromBase64(base64: string): UploadedImage {
  const clean = stripBase64Prefix(base64);
  return { dataUrl: `data:image/jpeg;base64,${clean}`, base64: clean, width: 0, height: 0 };
}

export function base64ToBlobUrl(b64: string, mime = "image/jpeg"): string {
  const clean = stripBase64Prefix(b64);
  const byteString = atob(clean);
  const buf = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) buf[i] = byteString.charCodeAt(i);
  return URL.createObjectURL(new Blob([buf], { type: mime }));
}

export async function fileToResizedBase64(file: File): Promise<{ dataUrl: string; base64: string; width: number; height: number }> {
  if (file.size > MAX_BYTES) throw new Error("Ảnh quá lớn (tối đa 10MB).");
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  const shortEdge = Math.min(img.width, img.height);
  if (shortEdge < MIN_SHORT_EDGE) throw new Error("Ảnh quá nhỏ (cạnh ngắn tối thiểu 512px).");

  const longEdge = Math.max(img.width, img.height);
  const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const out = canvas.toDataURL("image/jpeg", 0.9);
  return { dataUrl: out, base64: stripBase64Prefix(out), width: w, height: h };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function downloadBase64(b64: string, filename: string) {
  const url = base64ToBlobUrl(b64);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function shareBase64(b64: string, filename = "outfit.jpg") {
  const blob = await (await fetch(base64ToBlobUrl(b64))).blob();
  const file = new File([blob], filename, { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Outfit của tôi" });
  } else {
    downloadBase64(b64, filename);
  }
}
