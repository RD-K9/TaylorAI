export default function LoadingOverlay({ show, message = 'Đang xử lý...' }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl px-8 py-6 shadow-xl flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-700 font-medium">{message}</p>
      </div>
    </div>
  );
}
