import { useState } from 'react';

export default function TextureZoom({ fabricImage, garmentImage, onClose }) {
  const [zoom, setZoom] = useState(false);
  if (!fabricImage) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl max-w-4xl w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">So sánh texture vải</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800">
            Đóng
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Vải upload</p>
            <img
              src={fabricImage}
              alt="Fabric"
              className={`w-full rounded-lg border cursor-zoom-in ${zoom ? 'scale-150 origin-center' : ''}`}
              onClick={() => setZoom(!zoom)}
            />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Quần áo generate</p>
            <img src={garmentImage} alt="Garment" className="w-full rounded-lg border" />
          </div>
        </div>
      </div>
    </div>
  );
}
