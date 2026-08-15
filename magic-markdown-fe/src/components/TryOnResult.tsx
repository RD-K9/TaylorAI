import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, RotateCcw } from "lucide-react";
import { downloadBase64, shareBase64 } from "@/lib/imageUtils";
import type { UploadedImage } from "@/lib/types";

interface Props {
  personImage: UploadedImage;
  resultBase64: string;
  onReset: () => void;
}

export function TryOnResult({ personImage, resultBase64, onReset }: Props) {
  const [pos, setPos] = useState(50);
  const afterUrl = `data:image/jpeg;base64,${resultBase64}`;

  return (
    <div className="space-y-6">
      <div className="editorial-rule">
        <span className="editorial-rule-line" />
        <span className="font-display italic text-2xl text-gold">Người Mặc</span>
        <span className="editorial-rule-line" />
      </div>

      <div className="relative max-w-2xl mx-auto select-none">
        <div className="frame-double">
          <div className="relative aspect-[3/4] overflow-hidden">
            <img src={personImage.dataUrl} alt="Trước" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
              <img
                src={afterUrl}
                alt="Sau"
                className="absolute inset-0 h-full object-cover"
                style={{ width: `${(100 / pos) * 100}%`, maxWidth: "none" }}
              />
            </div>
            <div
              className="absolute top-0 bottom-0 w-px bg-gold pointer-events-none"
              style={{ left: `${pos}%` }}
            >
              <span className="absolute top-1/2 -translate-y-1/2 -left-3 h-6 w-6 rounded-full bg-gold border-2 border-ivory" />
            </div>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="w-full mt-4 accent-gold"
          aria-label="So sánh trước/sau"
        />
        <div className="flex justify-between text-[10px] tracking-widest uppercase text-muted-foreground">
          <span>Trước</span>
          <span>Sau</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          onClick={() => downloadBase64(resultBase64, "tryon.jpg")}
          className="rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
        >
          <Download className="h-4 w-4 mr-2" /> Tải xuống
        </Button>
        <Button
          variant="outline"
          onClick={() => shareBase64(resultBase64)}
          className="rounded-full border-gold text-gold hover:bg-gold hover:text-ivory"
        >
          <Share2 className="h-4 w-4 mr-2" /> Share
        </Button>
        <Button
          variant="outline"
          onClick={onReset}
          className="rounded-full border-charcoal text-charcoal hover:bg-charcoal hover:text-ivory"
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Thử outfit khác
        </Button>
      </div>
    </div>
  );
}
