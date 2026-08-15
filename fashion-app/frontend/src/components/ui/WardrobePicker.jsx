import { useEffect, useState } from 'react';
import { useWardrobe } from '../../hooks/useWardrobe.js';

export default function WardrobePicker({
  open,
  onClose,
  mode = 'browse',
  onPickPerson,
  onPickGarment,
}) {
  const { people, garments, loading, refresh, removePerson, removeGarment } = useWardrobe();
  const [tab, setTab] = useState(mode === 'garment' ? 'garments' : 'people');

  useEffect(() => {
    if (open) {
      void refresh();
      setTab(mode === 'garment' ? 'garments' : 'people');
    }
  }, [open, mode, refresh]);

  if (!open) return null;

  const showPeople = mode === 'browse' || mode === 'person';
  const showGarments = mode === 'browse' || mode === 'garment';
  const title =
    mode === 'person' ? 'Chọn ảnh người' : mode === 'garment' ? 'Chọn quần áo' : 'Tủ đồ';

  const items =
    tab === 'garments'
      ? garments.map((g) => ({
          id: g.id,
          src: `data:image/jpeg;base64,${g.imageBase64}`,
          onPick: onPickGarment ? () => onPickGarment(g) : undefined,
          onDelete: () => removeGarment(g.id),
        }))
      : people.map((p) => ({
          id: p.id,
          src: p.dataUrl,
          onPick: onPickPerson ? () => onPickPerson(p) : undefined,
          onDelete: () => removePerson(p.id),
        }));

  const empty =
    tab === 'garments'
      ? 'Chưa lưu quần áo. Bấm Lưu quần áo khi thấy ảnh gen đẹp.'
      : 'Chưa lưu ảnh người. Bấm Lưu khi có ảnh muốn giữ.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
            Đóng
          </button>
        </div>

        {mode === 'browse' && (
          <div className="flex gap-2 mb-4">
            {showPeople && (
              <button
                type="button"
                onClick={() => setTab('people')}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  tab === 'people' ? 'bg-indigo-600 text-white' : 'border border-slate-200'
                }`}
              >
                Người ({people.length})
              </button>
            )}
            {showGarments && (
              <button
                type="button"
                onClick={() => setTab('garments')}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  tab === 'garments' ? 'bg-indigo-600 text-white' : 'border border-slate-200'
                }`}
              >
                Quần áo ({garments.length})
              </button>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-slate-500 italic text-center py-8">Đang tải tủ đồ...</p>
        ) : !items.length ? (
          <p className="text-sm text-slate-500 italic text-center py-10">{empty}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <div key={item.id} className="relative border border-slate-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  disabled={!item.onPick}
                  onClick={item.onPick}
                  className="block w-full disabled:cursor-default"
                >
                  <img src={item.src} alt="" className="w-full aspect-[3/4] object-cover" />
                </button>
                <button
                  type="button"
                  aria-label="Xóa khỏi tủ đồ"
                  onClick={() => item.onDelete()}
                  className="absolute top-2 right-2 text-xs px-2 py-1 bg-white/90 border border-red-200 text-red-600 rounded"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
