import GarmentCard from './ui/GarmentCard.jsx';

export default function GarmentPreview({
  garments,
  selectedGarmentId,
  hasFabric,
  onSelect,
  onRemix,
  onRemove,
  onFeedback,
  onZoom,
  onTryOn,
  onTryOnReady,
  canTryOn,
  isLoading,
  progress,
  onSave,
  isGarmentSaved,
}) {
  if (!garments.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl gap-3">
        <p>Chưa có gợi ý quần áo</p>
        <p className="text-sm">Upload ảnh người, chọn mùa + loại quần áo, rồi bấm Generate</p>
        {onTryOnReady && (
          <button
            type="button"
            onClick={onTryOnReady}
            className="mt-2 px-4 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Thử đồ có sẵn
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {isLoading && progress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-slate-600 mb-1">
            <span>Đang generate...</span>
            <span>
              {progress.current}/{progress.total}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {garments.map((g) => (
          <GarmentCard
            key={g.id}
            garment={g}
            selected={selectedGarmentId === g.id}
            onSelect={onSelect}
            onRemix={onRemix}
            onRemove={onRemove}
            onFeedback={onFeedback}
            onZoom={onZoom}
            hasFabric={hasFabric}
            onSave={onSave}
            saved={isGarmentSaved?.(g.imageBase64)}
          />
        ))}
      </div>
      {garments.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            disabled={!canTryOn || isLoading}
            onClick={onTryOn}
            className="px-6 py-3 bg-pink-600 text-white font-medium rounded-xl hover:bg-pink-700 disabled:opacity-50"
          >
            Người Mặc Quần Áo
          </button>
        </div>
      )}
    </div>
  );
}
