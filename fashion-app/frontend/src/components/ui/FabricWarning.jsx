export default function FabricWarning({ validation, onContinue }) {
  if (!validation || validation.compatible) return null;
  return (
    <div className="mb-4 p-4 rounded-lg border border-amber-300 bg-amber-50">
      <p className="text-sm font-medium text-amber-800">Cảnh báo vải</p>
      <p className="text-sm text-amber-700 mt-1">{validation.message_vi}</p>
      <button
        type="button"
        onClick={onContinue}
        className="mt-2 text-sm text-indigo-600 hover:underline"
      >
        Tiếp tục generate
      </button>
    </div>
  );
}
