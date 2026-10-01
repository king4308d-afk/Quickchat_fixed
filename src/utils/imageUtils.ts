/**
 * Utility to resize and compress user-selected images (e.g. Profile DP)
 * into an optimized data URL to avoid exceeding storage quotas while maintaining crisp quality.
 */
export function resizeImageToDataUrl(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const src = readerEvent.target?.result;
      if (typeof src !== 'string') {
        reject(new Error('Failed to read image as data URL'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding within maxWidth x maxHeight
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback to original read result if 2D context isn't supported
          resolve(src);
          return;
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(src);
        }
      };

      img.onerror = () => {
        // In case image decoding fails, fallback to raw reader result
        resolve(src);
      };

      img.src = src;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
