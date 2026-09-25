// Product photos are uploaded in three sizes so pages never download more than they show:
//   original (max 1600px)  -> product page main image / zoom
//   -md      (max 800px)   -> product cards, shop grid
//   -sm      (max 240px)   -> gallery thumbnails
// Images uploaded before this existed have no variants; <SmartImage> falls back to the original.

export type ImageVariant = 'md' | 'sm'

const PRODUCT_BUCKET_PATH = '/storage/v1/object/public/product-images/'

export function variantUrl(url: string, variant: ImageVariant): string {
  if (!url.includes(PRODUCT_BUCKET_PATH)) return url
  return url.replace(/(\.[a-z0-9]+)$/i, `-${variant}$1`)
}

export async function resizeImage(source: Blob, maxSide: number, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(source)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image encode failed'))), 'image/jpeg', quality),
  )
}
