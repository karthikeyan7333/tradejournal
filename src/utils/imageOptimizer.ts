/**
 * Image Optimizer & Compression Utility
 * Safely compresses screenshots using HTML5 Canvas with strict timeouts.
 * Always falls back to the original image if compression fails or times out.
 */

const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Validates if the file is an accepted image format (JPG, PNG, WEBP)
 */
export function isValidImageFile(file: File): boolean {
  if (!file) return false;
  if (ACCEPTED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return true;
  }
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext ? ACCEPTED_EXTENSIONS.includes(ext) : false;
}

/**
 * Reads a File as Data URL safely with an absolute timeout.
 * Falls back to createObjectURL if FileReader is unavailable.
 */
export function readFileAsDataURL(file: File, timeoutMs = 3000): Promise<string> {
  return new Promise((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          resolve(URL.createObjectURL(file));
        } catch {
          resolve('');
        }
      }
    }, timeoutMs);

    try {
      const reader = new FileReader();

      reader.onload = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(reader.result as string);
        }
      };

      reader.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          try {
            resolve(URL.createObjectURL(file));
          } catch {
            resolve('');
          }
        }
      };

      reader.readAsDataURL(file);
    } catch {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        try {
          resolve(URL.createObjectURL(file));
        } catch {
          resolve('');
        }
      }
    }
  });
}

/**
 * Compresses an image file with HTML5 Canvas.
 * Has an enforced timeout (default 2500ms) to ensure it NEVER hangs indefinitely.
 * Falls back to the original image data URL on any error or timeout.
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82,
  timeoutMs = 2500
): Promise<string> {
  if (!isValidImageFile(file)) {
    throw new Error('Unsupported image format. Please select JPG, PNG, or WEBP.');
  }

  // 1. Prepare canvas compression worker promise
  const compressionPromise = new Promise<string>((resolve, reject) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (e) {
      reject(e);
      return;
    }

    const img = new Image();

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Invalid image dimensions'));
          return;
        }

        // Scale down keeping aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Fill background white for JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        URL.revokeObjectURL(objectUrl);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          resolve(dataUrl);
        } else {
          reject(new Error('Failed to generate image data URL'));
        }
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = objectUrl;
  });

  // 2. Strict timeout race
  const timeoutPromise = new Promise<string>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Image compression timed out'));
    }, timeoutMs);
  });

  try {
    return await Promise.race([compressionPromise, timeoutPromise]);
  } catch (err) {
    console.warn('Canvas compression skipped/timed out, using original image fallback:', err);
    // Safe fallback to original image
    return await readFileAsDataURL(file);
  }
}
