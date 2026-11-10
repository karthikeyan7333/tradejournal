import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import { optimizeImage } from '../utils/imageOptimizer';

/**
 * Uploads a trade screenshot to Firebase Cloud Storage.
 * Securely places the file in: users/{userId}/trades/{tradeId}/{fileName}
 * Falls back to the optimized base64 string if cloud storage is offline.
 */
export async function uploadTradeImage(
  fileOrDataUrl: File | string,
  userId?: string | null,
  tradeId: string = 'general'
): Promise<string> {
  // 1. Ensure compressed data URL
  let dataUrl: string;
  if (typeof fileOrDataUrl === 'string') {
    dataUrl = fileOrDataUrl;
  } else {
    dataUrl = await optimizeImage(fileOrDataUrl);
  }

  // If user is not authenticated or storage not ready, return optimized dataUrl
  if (!userId || !storage) {
    return dataUrl;
  }

  try {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const fileName = `${timestamp}_${randomSuffix}.jpg`;
    const storagePath = `users/${userId}/trades/${tradeId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Upload with data_url format
    await uploadString(storageRef, dataUrl, 'data_url', {
      contentType: 'image/jpeg',
    });

    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Cloud Storage upload failed, falling back to compressed local image:', error);
    return dataUrl;
  }
}

/**
 * Deletes an image from Firebase Cloud Storage if it is a cloud storage URL
 */
export async function deleteTradeImage(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.includes('firebasestorage.googleapis.com')) {
    return;
  }

  try {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn('Failed to delete cloud storage image:', error);
  }
}
