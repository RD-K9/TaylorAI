import { useRef, useState } from 'react';
import { processUpload } from '../utils/imageProcessor.js';
import { stripBase64Prefix } from '../utils/base64.js';

export default function TryOnSetup({
  personImage,
  garment,
  onPersonFile,
  onClearPerson,
  onPickPerson,
  onSavePerson,
  personSaved,
  onGarmentFile,
  onClearGarment,
  onPickGarment,
  onSaveGarment,
  garmentSaved,
  onStart,
  canStart,
  loading,
}) {
  const personRef = useRef(null);
  const garmentRef = useRef(null);
  const [errors, setErrors] = useState({});

  const handleFile = async (kind, file, apply) => {
    if (!file) return;
    try {
      const dataUrl = await processUpload(file);
      apply(dataUrl);
      setErrors((prev) => ({ ...prev, [kind]: null }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, [kind]: e.message }));
    }
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-1">Thử đồ ảo</h3>
      <p className="text-xs text-slate-500 mb-4">
        Tải ảnh hoặc chọn từ tủ đồ. Ảnh gen chỉ lưu khi bạn bấm Lưu.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Slot
          title="Ảnh người"
          preview={personImage}
          inputRef={personRef}
          error={errors.person}
          saved={personSaved}
          saveLabel="Lưu ảnh người"
          onPickFile={() => personRef.current?.click()}
          onFile={(f) => handleFile('person', f, onPersonFile)}
          onClear={onClearPerson}
          onPickWardrobe={onPickPerson}
          onSave={personImage ? onSavePerson : undefined}
        />
        <Slot
          title="Ảnh quần áo"
          preview={garment ? garment.imageUrl : null}
          inputRef={garmentRef}
          error={errors.garment}
          saved={garmentSaved}
          saveLabel="Lưu quần áo"
          onPickFile={() => garmentRef.current?.click()}
          onFile={(f) =>
            handleFile('garment', f, (dataUrl) => onGarmentFile(dataUrl, stripBase64Prefix(dataUrl)))
          }
          onClear={onClearGarment}
          onPickWardrobe={onPickGarment}
          onSave={garment ? onSaveGarment : undefined}
        />
      </div>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          disabled={!canStart || loading}
          onClick={onStart}
          className="px-6 py-3 bg-pink-600 text-white font-medium rounded-xl hover:bg-pink-700 disabled:opacity-50"
        >
          {loading ? 'Đang thử đồ ảo...' : 'Bắt đầu thử đồ'}
        </button>
      </div>
      {!canStart && (
        <p className="text-xs text-slate-500 text-center mt-2">Cần đủ ảnh người và ảnh quần áo</p>
      )}
    </div>
  );
}

function Slot({
  title,
  preview,
  inputRef,
  error,
  saved,
  saveLabel,
  onPickFile,
  onFile,
  onClear,
  onPickWardrobe,
  onSave,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {preview && (
          <button type="button" onClick={onClear} className="text-xs text-red-600 hover:underline">
            Xóa ảnh
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {preview ? (
        <img src={preview} alt={title} className="w-full max-h-64 object-cover rounded-xl border-2 border-indigo-200" />
      ) : (
        <button
          type="button"
          onClick={onPickFile}
          className="w-full h-40 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500 hover:border-indigo-400"
        >
          Tải ảnh lên
        </button>
      )}
      <div className="mt-2 flex flex-col gap-2">
        {preview && onSave && (
          <button
            type="button"
            disabled={saved}
            onClick={onSave}
            className="w-full py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-70"
          >
            {saved ? 'Đã lưu' : saveLabel}
          </button>
        )}
        {preview && (
          <button
            type="button"
            onClick={onPickFile}
            className="w-full py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
          >
            Đổi ảnh khác
          </button>
        )}
        <button
          type="button"
          onClick={onPickWardrobe}
          className="w-full py-2 text-sm font-medium text-pink-700 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100"
        >
          Chọn từ tủ đồ
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
