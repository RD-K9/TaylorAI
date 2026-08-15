import { useEffect } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WardrobeGarment, WardrobePerson } from "@/lib/wardrobeDb";
import { useWardrobe } from "@/hooks/useWardrobe";

type Mode = "browse" | "person" | "garment";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: Mode;
  onPickPerson?: (person: WardrobePerson) => void;
  onPickGarment?: (garment: WardrobeGarment) => void;
}

export function WardrobePicker({
  open,
  onOpenChange,
  mode = "browse",
  onPickPerson,
  onPickGarment,
}: Props) {
  const { people, garments, loading, refresh, removePerson, removeGarment } = useWardrobe();
  const defaultTab = mode === "garment" ? "garments" : "people";

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display italic text-2xl text-charcoal">
            {mode === "person" ? "Chọn ảnh người" : mode === "garment" ? "Chọn quần áo" : "Tủ đồ"}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground italic py-8 text-center">Đang tải tủ đồ...</p>
        ) : (
          <Tabs defaultValue={defaultTab} key={`${open}-${defaultTab}`}>
            {mode === "browse" && (
              <TabsList className="w-full grid grid-cols-2 mb-4">
                <TabsTrigger value="people">Người ({people.length})</TabsTrigger>
                <TabsTrigger value="garments">Quần áo ({garments.length})</TabsTrigger>
              </TabsList>
            )}

            {(mode === "browse" || mode === "person") && (
              <TabsContent value="people" className="mt-0">
                <Grid
                  empty="Chưa lưu ảnh người. Bấm Lưu khi có ảnh muốn giữ."
                  items={people.map((p) => ({
                    id: p.id,
                    src: p.dataUrl,
                    onPick: onPickPerson ? () => onPickPerson(p) : undefined,
                    onDelete: () => removePerson(p.id),
                  }))}
                />
              </TabsContent>
            )}

            {(mode === "browse" || mode === "garment") && (
              <TabsContent value="garments" className="mt-0">
                <Grid
                  empty="Chưa lưu quần áo. Bấm Lưu quần áo khi thấy ảnh gen đẹp."
                  items={garments.map((g) => ({
                    id: g.id,
                    src: `data:image/jpeg;base64,${g.imageBase64}`,
                    onPick: onPickGarment ? () => onPickGarment(g) : undefined,
                    onDelete: () => removeGarment(g.id),
                  }))}
                />
              </TabsContent>
            )}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Grid({
  empty,
  items,
}: {
  empty: string;
  items: { id: string; src: string; onPick?: () => void; onDelete: () => void }[];
}) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-10">{empty}</p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <div key={item.id} className="relative group border border-border bg-card">
          <button
            type="button"
            onClick={item.onPick}
            disabled={!item.onPick}
            className="block w-full disabled:cursor-default"
          >
            <img src={item.src} alt="" className="w-full aspect-[3/4] object-cover" />
          </button>
          {item.onPick && (
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="text-[10px] tracking-widest uppercase text-ivory inline-flex items-center gap-1">
                <Bookmark className="h-3 w-3" /> Chọn
              </span>
            </div>
          )}
          <button
            type="button"
            aria-label="Xóa khỏi tủ đồ"
            onClick={(e) => {
              e.stopPropagation();
              item.onDelete();
            }}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-ivory/90 border border-border text-muted-foreground hover:text-destructive hover:border-destructive inline-flex items-center justify-center"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
