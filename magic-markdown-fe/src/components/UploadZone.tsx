import { useRef, useState } from "react";
import { Bookmark, BookmarkCheck, FolderOpen, Upload, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileToResizedBase64 } from "@/lib/imageUtils";
import type { UploadedImage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  hint?: string;
  required?: boolean;
  value: UploadedImage | null;
  onChange: (v: UploadedImage | null) => void;
  large?: boolean;
  showSave?: boolean;
  saved?: boolean;
  onSave?: () => void;
  saveLabel?: string;
  showWardrobe?: boolean;
  onPickWardrobe?: () => void;
}

export function UploadZone({
  label,
  hint,
  required,
  value,
  onChange,
  large,
  showSave,
  saved,
  onSave,
  saveLabel = "Lưu ảnh",
  showWardrobe,
  onPickWardrobe,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  async function handleFile(f: File | undefined | null) {
    if (!f) return;
    setError(null);
    try {
      const img = await fileToResizedBase64(f);
      onChange(img);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải ảnh");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="tracking-label text-charcoal">
          {label} {required && <span className="text-burgundy">*</span>}
        </label>
        {value && (
          <button
            onClick={() => onChange(null)}
            className="text-[11px] text-muted-foreground hover:text-burgundy transition-colors inline-flex items-center gap-1"
          >
            <X className="h-3 w-3" /> Xóa
          </button>
        )}
      </div>

      {value ? (
        <div className="space-y-2">
          <div className="frame-double">
            <img
              src={value.dataUrl}
              alt={label}
              className={cn("w-full object-cover", large ? "aspect-[3/4]" : "aspect-square")}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {showSave && onSave && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saved}
                onClick={onSave}
                className="rounded-full border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory disabled:opacity-70"
              >
                {saved ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 mr-1" /> Đã lưu
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4 mr-1" /> {saveLabel}
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" /> Đổi ảnh
            </Button>
            {showWardrobe && onPickWardrobe && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-gold text-gold hover:bg-gold hover:text-ivory"
                onClick={onPickWardrobe}
              >
                <FolderOpen className="h-4 w-4 mr-1" /> Tủ đồ
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "border border-dashed border-gold/50 bg-card/60 flex flex-col items-center justify-center gap-3 text-center px-6 transition-colors",
            large ? "py-16" : "py-10",
            drag && "bg-gold/5 border-gold"
          )}
        >
          <Upload className="h-6 w-6 text-gold" />
          <div className="font-display text-lg text-charcoal">Kéo thả ảnh vào đây</div>
          {hint && <p className="text-xs text-muted-foreground max-w-xs">{hint}</p>}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-1" /> Chụp ảnh
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" /> Chọn ảnh
            </Button>
            {showWardrobe && onPickWardrobe && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-gold text-gold hover:bg-gold hover:text-ivory"
                onClick={onPickWardrobe}
              >
                <FolderOpen className="h-4 w-4 mr-1" /> Chọn từ tủ đồ
              </Button>
            )}
          </div>
          <p className="text-[10px] tracking-wider text-muted-foreground">
            JPG · PNG · WEBP — tối đa 10MB
          </p>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
