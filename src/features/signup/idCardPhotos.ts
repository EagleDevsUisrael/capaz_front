import { create } from 'zustand'

export type Side = 'front' | 'back'

interface Photo {
  blob: Blob
  /** URL local para la vista previa (se libera al reemplazarla) */
  url: string
}

interface PhotosState {
  front: Photo | null
  back: Photo | null
  setPhoto: (side: Side, blob: Blob | null) => void
}

/**
 * Fotos del carnet: solo en memoria (son datos sensibles, no van a sessionStorage).
 * La cámara (IdCardCamera) y el paso 1 (IdCardStep) las comparten. Si se recarga la página, se pierden.
 */
export const useIdCardPhotos = create<PhotosState>()((set, get) => ({
  front: null,
  back: null,
  setPhoto: (side, blob) => {
    const prev = get()[side]
    if (prev) URL.revokeObjectURL(prev.url)
    set({ [side]: blob ? { blob, url: URL.createObjectURL(blob) } : null } as Partial<PhotosState>)
  },
}))

export const SIDE_LABEL: Record<Side, string> = { front: 'Frente', back: 'Reverso' }
