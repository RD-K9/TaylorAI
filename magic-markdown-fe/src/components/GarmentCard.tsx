import { Heart, ThumbsDown, Shuffle, Trash2, Check, Bookmark, BookmarkCheck } from "lucide-react";
import type { Garment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  garment: Garment;
  selected: boolean;
  saved?: boolean;
  onSelect: () => void;
  onFeedback: (f: "like" | "dislike") => void;
  onRemix: () => void;
  onDelete: () => void;
  onSave?: () => void;
}

export function GarmentCard({
  garment,
  selected,
  saved,
  onSelect,
  onFeedback,
  onRemix,
  onDelete,
  onSave,
}: Props) {
  return (
    <div
      className={cn(
        "group bg-card border transition-all flex flex-col",
        selected ? "border-gold shadow-lg" : "border-border"
      )}
    >
      <div className="frame-double m-3">
        <img
          src={garment.imageUrl}
          alt="Outfit"
          className="w-full aspect-[3/4] object-cover"
        />
      </div>
      <div className="px-4 pb-4 space-y-3 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-1.5">
          {garment.stylePref && (
            <span className="text-[10px] tracking-widest uppercase border border-charcoal px-2 py-0.5">
              {garment.stylePref}
            </span>
          )}
          {garment.budget && (
            <span className="text-[10px] tracking-widest uppercase border border-gold text-gold px-2 py-0.5">
              {garment.budget}
            </span>
          )}
          {(!garment.source || garment.source === "generated") && (
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground ml-auto">
              seed {garment.seed}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onFeedback("like")}
            aria-label="Thích"
            className={cn(
              "h-8 w-8 inline-flex items-center justify-center rounded-full border transition-colors",
              garment.feedback === "like"
                ? "border-burgundy bg-burgundy text-ivory"
                : "border-border text-charcoal hover:border-burgundy hover:text-burgundy"
            )}
          >
            <Heart className="h-4 w-4" />
          </button>
          <button
            onClick={() => onFeedback("dislike")}
            aria-label="Không thích"
            className={cn(
              "h-8 w-8 inline-flex items-center justify-center rounded-full border transition-colors",
              garment.feedback === "dislike"
                ? "border-charcoal bg-charcoal text-ivory"
                : "border-border text-charcoal hover:border-charcoal"
            )}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
          <button
            onClick={onRemix}
            aria-label="Remix"
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border text-charcoal hover:border-gold hover:text-gold transition-colors"
          >
            <Shuffle className="h-4 w-4" />
          </button>
          {onSave && (
            <button
              onClick={onSave}
              disabled={saved}
              aria-label={saved ? "Đã lưu" : "Lưu quần áo"}
              className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-full border transition-colors",
                saved
                  ? "border-gold bg-gold text-ivory"
                  : "border-border text-charcoal hover:border-gold hover:text-gold"
              )}
            >
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={onDelete}
            aria-label="Xóa"
            className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors ml-auto"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {onSave && (
          <Button
            variant="outline"
            size="sm"
            disabled={saved}
            onClick={onSave}
            className="rounded-full tracking-widest uppercase text-xs border-gold text-gold hover:bg-gold hover:text-ivory"
          >
            {saved ? (
              <>
                <BookmarkCheck className="h-3.5 w-3.5 mr-1" /> Đã lưu
              </>
            ) : (
              <>
                <Bookmark className="h-3.5 w-3.5 mr-1" /> Lưu quần áo
              </>
            )}
          </Button>
        )}

        <Button
          variant={selected ? "default" : "outline"}
          size="sm"
          onClick={onSelect}
          className={cn(
            "rounded-full mt-auto tracking-widest uppercase text-xs",
            selected
              ? "bg-gold text-ivory hover:bg-gold/90 border-gold"
              : "border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory"
          )}
        >
          {selected ? (
            <>
              <Check className="h-3.5 w-3.5 mr-1" /> Đã chọn
            </>
          ) : (
            "Chọn"
          )}
        </Button>
      </div>
    </div>
  );
}
