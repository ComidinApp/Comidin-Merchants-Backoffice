// src/utils/download.js
export async function downloadFile(url, filename) {
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'omit', // 👈 importante para que el navegador permita CORS con "*"
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}
