import { useState } from 'react'
import { variantUrl, type ImageVariant } from '@/lib/image'

interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  /** Which resized copy to request. Falls back to the original if that copy doesn't exist. */
  variant?: ImageVariant
}

export function SmartImage({ src, variant, onError, ...rest }: SmartImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const resolved = variant && failedSrc !== src ? variantUrl(src, variant) : src
  return (
    <img
      {...rest}
      src={resolved}
      decoding="async"
      onError={(e) => {
        if (resolved !== src) setFailedSrc(src)
        onError?.(e)
      }}
    />
  )
}
