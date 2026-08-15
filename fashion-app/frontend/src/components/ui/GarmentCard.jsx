import FeedbackPanel from '../ui/FeedbackPanel.jsx';

export default function GarmentCard({
  garment,
  selected,
  onSelect,
  onRemix,
  onRemove,
  onFeedback,
  onZoom,
  hasFabric,
  onSave,
  saved,
}) {
  return (
    <div
      className={`rounded-xl border overflow-hidden bg-white shadow-sm transition-all ${
        selected ? 'ring-2 ring-indigo-500 border-indigo-300' : 'border-slate-200'
      }`}
    >
      <img src={garment.imageUrl} alt="Garment" className="w-full aspect-square object-cover" />
      <div className="p-3 space-y-2">
        {garment.stylePref && (
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{garment.stylePref}</span>
        )}
        {garment.budget && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded ml-1">{garment.budget}</span>
        )}
        <FeedbackPanel
          feedback={garment.feedback}
          onGood={() => onFeedback(garment.id, 'good')}
          onBad={() => onFeedback(garment.id, 'bad')}
        />
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={() => onSelect(garment.id)} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Chọn
          </button>
          {onSave && (
            <button
              type="button"
              disabled={saved}
              onClick={() => onSave(garment.id)}
              className="text-xs px-2 py-1 bg-pink-50 text-pink-700 border border-pink-200 rounded hover:bg-pink-100 disabled:opacity-70"
            >
              {saved ? 'Đã lưu' : 'Lưu quần áo'}
            </button>
          )}
          <button type="button" onClick={() => onRemix(garment.id)} className="text-xs px-2 py-1 border rounded hover:bg-slate-50">
            Không muốn → Remix
          </button>
          {hasFabric && (
            <button type="button" onClick={() => onZoom(garment.imageUrl)} className="text-xs px-2 py-1 border rounded hover:bg-slate-50">
              Zoom texture
            </button>
          )}
          <button type="button" onClick={() => onRemove(garment.id)} className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50">
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
