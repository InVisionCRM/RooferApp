import { put, del } from "@vercel/blob"

/**
 * Uploads a photo to Vercel Blob storage with thumbnail generation
 */
export async function uploadPhotoToBlob(
  file: File,
  leadId: string
): Promise<{ url: string; thumbnailUrl: string }> {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filename = `leads/${leadId}/photos/${timestamp}-${safeName}`

    // Upload full-size image to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: true,
    })

    // For now, use the same URL for thumbnail
    // In production, you'd generate an actual thumbnail here
    const thumbnailUrl = await generateThumbnail(file, leadId, timestamp)

    return {
      url: blob.url,
      thumbnailUrl: thumbnailUrl || blob.url, // Fallback to full image if thumbnail fails
    }
  } catch (error) {
    console.error("Error uploading photo to Vercel Blob:", error)
    throw new Error("Failed to upload photo to storage")
  }
}

/**
 * Generates a thumbnail from the uploaded image
 */
async function generateThumbnail(
  file: File,
  leadId: string,
  timestamp: number
): Promise<string | null> {
  try {
    // Create thumbnail using canvas
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // In a browser environment, we'd use canvas
    // For server-side, we need sharp or similar
    // For now, we'll skip thumbnail generation and use a query parameter
    // Vercel Blob supports image optimization via URL parameters

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const thumbnailFilename = `leads/${leadId}/thumbnails/${timestamp}-thumb-${safeName}`

    // Create a smaller version (simplified - in production use sharp)
    const thumbnailBlob = await put(thumbnailFilename, buffer, {
      access: "public",
      addRandomSuffix: true,
    })

    return thumbnailBlob.url
  } catch (error) {
    console.error("Error generating thumbnail:", error)
    return null
  }
}

/**
 * Deletes a photo from Vercel Blob storage
 */
export async function deletePhotoFromBlob(url: string): Promise<void> {
  try {
    await del(url)
  } catch (error) {
    console.error("Error deleting photo from Vercel Blob:", error)
    // Don't throw error for delete failures - log and continue
  }
}

/**
 * Creates a thumbnail URL for an existing Vercel Blob image
 * Uses Vercel's built-in image optimization
 */
export function getThumbnailUrl(originalUrl: string, width = 300, height = 300): string {
  try {
    const url = new URL(originalUrl)
    // Add Vercel Blob image optimization parameters
    url.searchParams.set("w", width.toString())
    url.searchParams.set("h", height.toString())
    url.searchParams.set("fit", "cover")
    return url.toString()
  } catch {
    return originalUrl
  }
}

/**
 * Validates file before upload
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (increased for videos)
  const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "video/webm", "video/mp4"]

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${ALLOWED_TYPES.join(", ")}`,
    }
  }

  return { valid: true }
}

/**
 * Compresses an image file before upload (client-side)
 */
export async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress image"))
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          "image/jpeg",
          quality
        )
      }
      img.onerror = () => reject(new Error("Could not load image"))
    }
    reader.onerror = () => reject(new Error("Could not read file"))
  })
}

