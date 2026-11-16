import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Button } from '@/shared/ui'
import { ArrowLeftIcon, CheckIcon } from '@/shared/ui/icons'
import { CARD_ASPECT, cropCameraFrame, cropGalleryImage } from './idCardImage'
import { SIDE_LABEL, useIdCardPhotos, type Side } from './idCardPhotos'
import { useSignupStore } from './useSignupStore'
import './signup.css'

type Phase = 'starting' | 'framing' | 'ready' | 'cropping' | 'processing' | 'review' | 'noCamera'

/** Tiempo con la cámara quieta antes de pasar a "listo" (no detectamos el carnet: es una guía) */
const READY_AFTER_MS = 1500

/**
 * Cámara del carnet (pantalla completa): encuadrando → listo → revisar foto.
 * Si no hay cámara o la persona no da permiso, puede elegir una foto del teléfono.
 * Al usar la foto vuelve al paso 1 (/signup/id-card).
 */
export function IdCardCamera() {
  const [params] = useSearchParams()
  const side: Side = params.get('side') === 'back' ? 'back' : 'front'
  const navigate = useNavigate()
  const setPhoto = useIdCardPhotos((s) => s.setPhoto)
  const saveIdCard = useSignupStore((s) => s.saveIdCard)
  const videoRef = useRef<HTMLVideoElement>(null)
  const guideRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hasCamera = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
  const [phase, setPhase] = useState<Phase>(hasCamera ? 'starting' : 'noCamera')
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null)
  const [gallery, setGallery] = useState<{ file: File; url: string } | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const label = SIDE_LABEL[side].toLowerCase()

  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  /** Abre la cámara. Solo cambia el estado después de await (sin renders en cascada desde el efecto). */
  const openStream = async () => {
    if (!hasCamera) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => undefined)
      }
      setPhase('framing')
    } catch {
      setPhase('noCamera')
    }
  }

  /** "Intentar de nuevo" / volver a tomar: desde un evento sí se puede poner 'starting' primero */
  const start = () => {
    stop()
    setPhase(hasCamera ? 'starting' : 'noCamera')
    void openStream()
  }

  useEffect(() => {
    headingRef.current?.focus()
    // Suscripción a un sistema externo (la cámara): el estado cambia después de await, no en el cuerpo del efecto
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void openStream()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [side])

  useEffect(() => {
    if (phase !== 'framing') return
    const t = setTimeout(() => setPhase('ready'), READY_AFTER_MS)
    return () => clearTimeout(t)
  }, [phase])

  useEffect(() => () => { if (shot) URL.revokeObjectURL(shot.url) }, [shot])
  useEffect(() => () => { if (gallery) URL.revokeObjectURL(gallery.url) }, [gallery])

  const setReview = (blob: Blob) => {
    setShot((previous) => {
      if (previous) URL.revokeObjectURL(previous.url)
      return { blob, url: URL.createObjectURL(blob) }
    })
    setPhase('review')
  }

  const capture = async () => {
    const v = videoRef.current
    const frame = guideRef.current
    if (!v || !v.videoWidth || !frame) return
    setPhase('processing')
    setPhotoError(null)
    try {
      setReview(await cropCameraFrame(v, frame))
    } catch {
      setPhotoError('No pudimos preparar la foto. Intenta tomarla otra vez.')
      setPhase('ready')
    }
  }

  const chooseFromGallery = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return
    if (gallery) URL.revokeObjectURL(gallery.url)
    stop()
    setGallery({ file, url: URL.createObjectURL(file) })
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedArea(null)
    setPhotoError(null)
    setPhase('cropping')
  }

  const confirmGalleryCrop = async () => {
    if (!gallery || !croppedArea) return
    setPhase('processing')
    setPhotoError(null)
    try {
      setReview(await cropGalleryImage(gallery.file, croppedArea))
    } catch {
      setPhotoError('No pudimos abrir esa imagen. Elige una foto JPG, PNG o WebP.')
      setPhase('cropping')
    }
  }

  const use = (blob: Blob) => {
    stop()
    setPhoto(side, blob)
    saveIdCard({ scanId: null, needsReview: [], confirmed: false })
    // Después del frente, sigue con el reverso si todavía no está
    if (side === 'front' && !useIdCardPhotos.getState().back) navigate('/signup/id-card/camera?side=back')
    else navigate('/signup/id-card')
  }

  const status: Record<Phase, string> = {
    starting: 'Abriendo la cámara…',
    framing: `Encuadra el ${label} del carnet dentro del recuadro`,
    ready: '¡Listo! Toca el botón para tomar la foto',
    cropping: 'Mueve y amplía la foto hasta que el carnet llene el recuadro',
    processing: 'Mejorando la foto…',
    review: '¿Se leen bien los datos?',
    noCamera: 'No pudimos abrir la cámara. Elige una foto de tu teléfono.',
  }

  return (
    <div className="camera">
      <header className="camera__top">
        <Link to="/signup/id-card" className="camera__back" onClick={stop}>
          <ArrowLeftIcon size={20} /> Atrás
        </Link>
        <h1 ref={headingRef} tabIndex={-1} className="camera__title">
          Foto del {label}
        </h1>
      </header>

      <div className="camera__stage" aria-busy={phase === 'processing'}>
        <video
          ref={videoRef}
          className="camera__video"
          playsInline
          muted
          aria-hidden="true"
          hidden={phase === 'review' || phase === 'cropping' || phase === 'processing' || phase === 'noCamera'}
        />
        {phase === 'review' && shot && (
          <img src={shot.url} alt={`Foto tomada y recortada del ${label} de tu carnet`} className="camera__preview" />
        )}
        {phase === 'cropping' && gallery && (
          <Cropper
            image={gallery.url}
            crop={crop}
            zoom={zoom}
            aspect={CARD_ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setCroppedArea(pixels)}
            cropShape="rect"
            showGrid
            objectFit="contain"
          />
        )}
        {(phase === 'framing' || phase === 'ready') && (
          <div ref={guideRef} className={`camera__guide${phase === 'ready' ? ' is-ready' : ''}`} aria-hidden="true">
            {phase === 'ready' && <CheckIcon size={48} />}
          </div>
        )}
        {phase === 'processing' && <div className="camera__processing">Preparando imagen…</div>}
      </div>

      <p className="camera__status" role="status" aria-live="polite">
        {status[phase]}
      </p>
      {photoError && <p className="camera__error" role="alert">{photoError}</p>}

      <div className="camera__actions">
        {(phase === 'framing' || phase === 'ready') && (
          <Button variant={phase === 'ready' ? 'sun' : 'primary'} fullWidth onPress={capture}>
            Tomar foto
          </Button>
        )}
        {phase === 'review' && shot && (
          <>
            <Button fullWidth onPress={() => use(shot.blob)}>
              Usar esta foto
            </Button>
            <Button variant="secondary" fullWidth onPress={() => { setShot(null); start() }}>
              Tomar otra
            </Button>
          </>
        )}
        {phase === 'cropping' && (
          <>
            <label className="camera__zoom">
              Ampliar foto
              <input
                type="range"
                min={1}
                max={3}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
              />
            </label>
            <Button fullWidth onPress={confirmGalleryCrop} isDisabled={!croppedArea}>
              Usar este recorte
            </Button>
            <Button variant="secondary" fullWidth onPress={start}>
              Cancelar
            </Button>
          </>
        )}
        {phase === 'noCamera' && (
          <Button variant="secondary" fullWidth onPress={start}>
            Intentar abrir la cámara otra vez
          </Button>
        )}
        {phase !== 'cropping' && phase !== 'processing' && (
          <>
            <input
              id="camera-file"
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                chooseFromGallery(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <label htmlFor="camera-file" className="camera__file">
              Elegir de la galería
            </label>
          </>
        )}
        <p className="camera__tip">Consejo: pon el carnet sobre una mesa oscura, con buena luz y sin reflejos.</p>
      </div>
    </div>
  )
}
