import {
  BODY_SHAPES,
  BODY_TYPES,
  BUDGETS,
  CLOTHES_TYPES,
  FITS,
  GENERATE_COUNTS,
  OCCASIONS,
  REGIONS,
  SEASONS,
  STYLES,
} from '../constants/filters.js';
import FilterChipGroup from './ui/FilterChipGroup.jsx';

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function FilterSidebar({
  filters,
  generateCount,
  dispatch,
  onGenerate,
  canGenerate,
  tooltip,
}) {
  const set = (field) => (value) => dispatch({ type: 'SET_FILTER', field, value });

  const conflict =
    filters.fitPref === 'Slim fit' && filters.bodyType === 'Mũm mĩm'
      ? 'Có thể không thoải mái với Slim fit — thử Regular fit.'
      : null;

  return (
    <div className="space-y-1">
      <FilterChipGroup label="Mùa *" options={SEASONS} value={filters.season} onChange={set('season')} />
      <FilterChipGroup label="Thể trạng" options={BODY_TYPES} value={filters.bodyType} onChange={set('bodyType')} />
      <SelectField label="Body type (Tùy chọn)" value={filters.bodyShape} onChange={set('bodyShape')} options={BODY_SHAPES} />
      <FilterChipGroup label="Loại quần áo *" options={CLOTHES_TYPES} value={filters.clothesType} onChange={set('clothesType')} />
      <SelectField label="Mục đích" value={filters.occasion} onChange={set('occasion')} options={OCCASIONS} />
      <SelectField label="Style preference" value={filters.stylePref} onChange={set('stylePref')} options={STYLES} />
      <SelectField label="Ngân sách" value={filters.budget} onChange={set('budget')} options={BUDGETS} />
      <SelectField label="Vùng địa lý" value={filters.region} onChange={set('region')} options={REGIONS} />
      <SelectField label="Fit preference" value={filters.fitPref} onChange={set('fitPref')} options={FITS} />

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-1">Generate multiple</label>
        <select
          value={generateCount}
          onChange={(e) => dispatch({ type: 'SET_GENERATE_COUNT', value: Number(e.target.value) })}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
        >
          {GENERATE_COUNTS.map((n) => (
            <option key={n} value={n}>
              {n} style{n > 1 ? 's' : ''} (tuần tự)
            </option>
          ))}
        </select>
        {generateCount >= 10 && (
          <p className="text-xs text-amber-600 mt-1">10 ảnh sẽ mất nhiều thời gian và tốn pollen.</p>
        )}
      </div>

      {conflict && <p className="text-xs text-amber-600 mb-2">{conflict}</p>}

      <button
        type="button"
        disabled={!canGenerate}
        title={tooltip || ''}
        onClick={onGenerate}
        className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Generate Quần Áo
      </button>
      {!canGenerate && tooltip && (
        <p className="text-xs text-slate-500 mt-1">{tooltip}</p>
      )}
    </div>
  );
}
