import { useRef, useState } from 'react';
import { useImageUpload } from '../hooks/useImageUpload.js';

function UploadZone({
  label,
  required,
  hint,
  preview,
  error,
  onUpload,
  onClear,
  inputId,
  variant = 'default',
  onSave,
  saved,
  saveLabel = 'Lưu ảnh',
  onPickWardrobe,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  const isHero = variant === 'hero';

  return (
    <div className={isHero ? 'mb-0' : 'mb-4'}>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {preview && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-red-600 hover:underline"
          >
            Xóa ảnh
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-slate-500 mb-2">{hint}</p>}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="sr-only"
        onChange={(e) => {
          onUpload(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt={label}
            className={`w-full object-cover rounded-xl border-2 border-indigo-200 ${
              isHero ? 'max-h-72' : 'max-h-40'
            }`}
          />
          <div className="mt-2 flex flex-col gap-2">
            {onSave && (
              <button
                type="button"
                disabled={saved}
                onClick={onSave}
                className="w-full py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 disabled:opacity-70"
              >
                {saved ? 'Đã lưu' : saveLabel}
              </button>
            )}
            <button
              type="button"
              onClick={pickFile}
              className="w-full py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
            >
              Đổi ảnh khác
            </button>
            {onPickWardrobe && (
              <button
                type="button"
                onClick={onPickWardrobe}
                className="w-full py-2 text-sm font-medium text-pink-700 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100"
              >
                Chọn từ tủ đồ
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={pickFile}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && pickFile()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors text-center ${
            isHero ? 'px-6 py-10' : 'px-4 py-6'
          } ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50'
          }`}
        >
          <div className={`mx-auto mb-3 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center ${isHero ? 'w-14 h-14 text-2xl' : 'w-10 h-10 text-xl'}`}>
            +
          </div>
          <p className={`font-semibold text-slate-800 ${isHero ? 'text-base' : 'text-sm'}`}>
            {isHero ? 'Bấm để chọn ảnh người' : 'Chọn ảnh'}
          </p>
          <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP — tối đa 10MB</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              pickFile();
            }}
            className={`mt-3 inline-flex items-center justify-center font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 ${
              isHero ? 'px-6 py-2.5 text-sm' : 'px-4 py-2 text-xs'
            }`}
          >
            Upload ảnh
          </button>
          {onPickWardrobe && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPickWardrobe();
              }}
              className={`mt-2 inline-flex items-center justify-center font-medium text-pink-700 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 ${
                isHero ? 'px-6 py-2.5 text-sm' : 'px-4 py-2 text-xs'
              }`}
            >
              Chọn từ tủ đồ
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}

export default function ImageUploader({
  inputs,
  dispatch,
  variant = 'default',
  hidePerson = false,
  onSavePerson,
  personSaved,
  onPickPerson,
}) {
  const { upload, clear } = useImageUpload(dispatch);
  const [errors, setErrors] = useState({});

  const handle = async (field, file) => {
    if (!file) return;
    const err = await upload(field, file);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const showOptional = variant !== 'hero';

  return (
    <div className="space-y-1">
      {!hidePerson && (
        <UploadZone
          inputId="person-upload"
          label="Ảnh người"
          required
          variant={variant === 'hero' ? 'hero' : 'default'}
          preview={inputs.personImage}
          error={errors.personImage}
          onUpload={(f) => handle('personImage', f)}
          onClear={() => clear('personImage')}
          onSave={onSavePerson}
          saved={personSaved}
          saveLabel="Lưu ảnh người"
          onPickWardrobe={onPickPerson}
        />
      )}

      {hidePerson && showOptional && (
        <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-3">
          Upload ảnh người ở panel chính bên phải trước.
        </p>
      )}

      {showOptional && (
        <>
          <div className="border-t border-slate-100 pt-4 mt-2">
            <p className="text-sm font-medium text-slate-700 mb-2">Dáng người (Tùy chọn)</p>
            <p className="text-xs text-slate-500 mb-2">Bạn có thể bỏ trống nếu không muốn nhập</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { field: 'height', placeholder: 'Chiều cao (cm)' },
                { field: 'bust', placeholder: 'Ngực (cm)' },
                { field: 'waist', placeholder: 'Eo (cm)' },
                { field: 'hips', placeholder: 'Mông (cm)' },
              ].map(({ field, placeholder }) => (
                <input
                  key={field}
                  type="number"
                  placeholder={placeholder}
                  value={inputs.bodyMeasurements[field]}
                  onChange={(e) =>
                    dispatch({ type: 'SET_MEASUREMENT', field, value: e.target.value })
                  }
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              ))}
            </div>
          </div>
          <UploadZone
            inputId="fabric-upload"
            label="Chất liệu vải (Tùy chọn)"
            hint="Không upload vẫn generate bình thường"
            preview={inputs.fabricImage}
            error={errors.fabricImage}
            onUpload={(f) => handle('fabricImage', f)}
            onClear={() => clear('fabricImage')}
          />
          <UploadZone
            inputId="ref-upload"
            label="Ảnh mẫu (Tùy chọn)"
            hint="Style reference"
            preview={inputs.referenceImage}
            error={errors.referenceImage}
            onUpload={(f) => handle('referenceImage', f)}
            onClear={() => clear('referenceImage')}
          />
        </>
      )}
    </div>
  );
}
