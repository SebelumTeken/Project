export function kecilkanGambar(
  file: File,
  ukuranMaksimal: number = 1600
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const skala = Math.min(
        1,
        ukuranMaksimal / Math.max(image.naturalWidth, image.naturalHeight)
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * skala));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * skala));

      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Browser tidak dapat memproses gambar.'));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gambar tidak dapat dibaca.'));
    };

    image.src = objectUrl;
  });
}
