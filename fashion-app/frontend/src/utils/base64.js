export function stripBase64Prefix(dataUrl) {
  if (!dataUrl) return '';
  return dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
}

export function base64ToObjectUrl(b64, mime = 'image/jpeg') {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  return URL.createObjectURL(blob);
}

export function downloadBase64Image(b64, filename = 'fashion-outfit.jpg') {
  const url = base64ToObjectUrl(b64);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function shareBase64Image(b64, title = 'Thiết kế quần áo') {
  const url = base64ToObjectUrl(b64);
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const file = new File([blob], 'outfit.jpg', { type: 'image/jpeg' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
    } else if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Đã copy link ảnh vào clipboard.');
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}
