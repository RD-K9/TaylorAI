import { REMIX_FIELDS } from '../../constants/filters.js';

export default function RemixModal({ show, filters, onClose, onRemix, onAuto }) {
  if (!show) return null;

  const cycle = (field, options) => {
    const vals = ['', ...options];
    const i = vals.indexOf(filters[field] || '');
    return vals[(i + 1) % vals.length];
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-lg mb-4">Không muốn style này → Remix</h3>
        <p className="text-sm text-slate-600 mb-4">Chọn filter muốn thay đổi:</p>
        <div className="space-y-2">
          {REMIX_FIELDS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className="w-full text-left px-3 py-2 rounded-lg border hover:bg-indigo-50 text-sm"
              onClick={() => {
                if (key === 'season') onRemix({ season: cycle('season', ['Xuân', 'Hè', 'Thu', 'Đông']) });
                else if (key === 'bodyType') onRemix({ bodyType: cycle('bodyType', ['Gầy', 'Trung bình', 'Mũm mĩm']) });
                else if (key === 'clothesType') onRemix({ clothesType: cycle('clothesType', ['Áo', 'Quần', 'Váy', 'Set']) });
                else if (key === 'stylePref') onRemix({ autoStyle: true });
                else if (key === 'budget') onRemix({ budget: cycle('budget', ['Low', 'Mid', 'High']) });
              }}
            >
              Đổi {label}
            </button>
          ))}
          <button
            type="button"
            className="w-full px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            onClick={onAuto}
          >
            Để AI đổi ngẫu nhiên
          </button>
        </div>
        <button type="button" onClick={onClose} className="mt-4 text-sm text-slate-500 hover:underline">
          Hủy
        </button>
      </div>
    </div>
  );
}
