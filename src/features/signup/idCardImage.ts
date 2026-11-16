import type { Area } from 'react-easy-crop'

const CARD_ASPECT = 85.6 / 54
const MAX_OUTPUT_WIDTH = 2000

export { CARD_ASPECT }

function toJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo preparar la foto'))),
      'image/jpeg',
      0.94,
    )
  })
}

/**
 * Genera un JPEG legible para OCR: limita el tamaño, usa reescalado de alta
 * calidad y mejora levemente contraste/luz sin alterar el contenido del carnet.
 */
async function renderEnhanced(
  source: CanvasImageSource,
  sourceRect: { x: number; y: number; width: number; height: number },
) {
  const width = Math.min(MAX_OUTPUT_WIDTH, Math.max(1, Math.round(sourceRect.width)))
  const height = Math.max(1, Math.round(width / (sourceRect.width / sourceRect.height)))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('El navegador no pudo procesar la foto')

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.filter = 'contrast(1.1) brightness(1.02) saturate(0.94)'
  context.drawImage(
    source,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    width,
    height,
  )
  context.filter = 'none'
  return toJpeg(canvas)
}

/** Recorta exactamente el marco que la persona ve sobre la cámara. */
export async function cropCameraFrame(video: HTMLVideoElement, frame: HTMLElement) {
  const videoRect = video.getBoundingClientRect()
  const frameRect = frame.getBoundingClientRect()
  const scale = Math.max(videoRect.width / video.videoWidth, videoRect.height / video.videoHeight)
  const renderedWidth = video.videoWidth * scale
  const renderedHeight = video.videoHeight * scale
  const renderedLeft = videoRect.left + (videoRect.width - renderedWidth) / 2
  const renderedTop = videoRect.top + (videoRect.height - renderedHeight) / 2

  const x = Math.max(0, (frameRect.left - renderedLeft) / scale)
  const y = Math.max(0, (frameRect.top - renderedTop) / scale)
  const width = Math.min(video.videoWidth - x, frameRect.width / scale)
  const height = Math.min(video.videoHeight - y, frameRect.height / scale)
  return renderEnhanced(video, { x, y, width, height })
}

/** Materializa el área elegida con arrastre/zoom en el editor de galería. */
export async function cropGalleryImage(file: Blob, crop: Area) {
  const image = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    return await renderEnhanced(image, crop)
  } finally {
    image.close()
  }
}
