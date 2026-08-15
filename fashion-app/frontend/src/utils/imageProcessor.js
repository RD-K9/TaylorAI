const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;
const MIN_DIM = 512;
const MAX_DIM = 1536;

export function validateImageFile(file) {
  if (!file) return 'Không có file.';
  if (!ALLOWED.includes(file.type)) return 'Chỉ chấp nhận JPG, PNG, WebP.';
  if (file.size > MAX_SIZE) return 'Ảnh tối đa 10MB.';
  return null;
}

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function normalizeImageDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (Math.min(img.width, img.height) < MIN_DIM) {
        reject(new Error('Ảnh quá nhỏ (tối thiểu 512px cạnh ngắn).'));
        return;
      }
      let { width, height } = img;
      if (Math.max(width, height) > MAX_DIM) {
        const ratio = MAX_DIM / Math.max(width, height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Không đọc được ảnh.'));
    img.src = dataUrl;
  });
}

export async function processUpload(file) {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);
  const raw = await readFileAsDataURL(file);
  return normalizeImageDataUrl(raw);
}
