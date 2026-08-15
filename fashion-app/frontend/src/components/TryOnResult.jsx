import { downloadBase64Image, shareBase64Image } from '../utils/base64.js';
import CompareSlider from './ui/CompareSlider.jsx';

export default function TryOnResult({ result, personImage, error, onRetry, onTryAnother }) {
  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
        {error}
        <button type="button" onClick={onRetry} className="block mt-2 text-indigo-600 hover:underline">
          Thử lại
        </button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Người Mặc:</h3>
      {personImage && (
        <CompareSlider beforeSrc={personImage} afterSrc={result.url} />
      )}
      {!personImage && (
        <img src={result.url} alt="Try-On Result" className="max-w-md mx-auto rounded-xl shadow" />
      )}
      <div className="flex flex-wrap gap-3 justify-center mt-4">
        <button
          type="button"
          onClick={() => downloadBase64Image(result.base64)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
        >
          Tải Xuống
        </button>
        <button
          type="button"
          onClick={() => shareBase64Image(result.base64)}
          className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm"
        >
          Share
        </button>
        <button type="button" onClick={onTryAnother} className="px-4 py-2 text-indigo-600 text-sm hover:underline">
          Thử outfit khác
        </button>
      </div>
    </div>
  );
}
