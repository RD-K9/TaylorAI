const STEPS = [
  { key: 'input', label: 'Tải ảnh' },
  { key: 'processing', label: 'AI xử lý' },
  { key: 'preview', label: 'Xem trước' },
  { key: 'feedback', label: 'Phản hồi' },
  { key: 'tryon', label: 'Thử đồ' },
  { key: 'done', label: 'Hoàn tất' },
];

const order = STEPS.map((s) => s.key);

export default function StepIndicator({ currentStep }) {
  const idx = order.indexOf(currentStep);
  const active = idx < 0 ? 0 : idx;

  return (
    <nav className="flex flex-wrap gap-2 mb-6" aria-label="Tiến trình">
      {STEPS.map((step, i) => (
        <div
          key={step.key}
          className={`flex items-center gap-1 text-xs sm:text-sm px-3 py-1.5 rounded-full border ${
            i <= active
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-500 border-slate-200'
          }`}
        >
          <span className="font-medium">{i + 1}.</span>
          <span>{step.label}</span>
        </div>
      ))}
    </nav>
  );
}
