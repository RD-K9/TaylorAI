export default function FeedbackPanel({ feedback, onGood, onBad }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs text-slate-500">Chất lượng:</span>
      <button
        type="button"
        onClick={onGood}
        className={`text-xs px-2 py-1 rounded ${feedback === 'good' ? 'bg-green-100 text-green-800' : 'bg-slate-100'}`}
      >
        Good
      </button>
      <button
        type="button"
        onClick={onBad}
        className={`text-xs px-2 py-1 rounded ${feedback === 'bad' ? 'bg-red-100 text-red-800' : 'bg-slate-100'}`}
      >
        Not Good
      </button>
    </div>
  );
}
