import { useRef, useState, type DragEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError, errorMessage } from '@/shared/api/client'
import { useCatalog } from '@/shared/api/catalog'
import type { DisabilityType } from '@/shared/api/types'
import { Button, ChipGroup, Field } from '@/shared/ui'
import { ArrowRightIcon, CheckIcon } from '@/shared/ui/icons'
import { isValidCedula, scanIdCard } from './api'
import { focusFirstInvalid } from './ContactStep'
import { SIDE_LABEL, useIdCardPhotos, type Side } from './idCardPhotos'
import { DISABILITY_TYPES } from './options'
import { StepFrame } from './StepFrame'
import { emptyIdCard, useSignupStore, type IdCardData, type IdCardField } from './useSignupStore'

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp'

/** "1985-03-12" → "12/03/1985" */
const showDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split('-').reverse().join('/') : v)
const showValidity = (v: string) => (v === 'indefinite' ? 'Indefinida' : showDate(v))
/** Acepta "12/03/1985" o "1985-03-12" → "1985-03-12" (o el texto tal cual si no se entiende) */
const parseDate = (v: string) => {
  const m = v.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : v.trim()
}
const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

type Errors = Partial<Record<IdCardField, string>>

function validate(d: IdCardData): Errors {
  const e: Errors = {}
  if (d.fullName.trim().length < 3) e.fullName = 'Escribe tu nombre como aparece en el carnet'
  if (!isValidCedula(d.idNumber)) e.idNumber = 'La cédula no es válida. Revisa los 10 dígitos.'
  if (d.birthDate && !isIsoDate(d.birthDate)) e.birthDate = 'Escribe la fecha así: 12/03/1985'
  if (!d.disabilityType) e.disabilityType = 'Elige el tipo de discapacidad del carnet'
  if (!d.disabilityPercent || d.disabilityPercent < 1 || d.disabilityPercent > 100)
    e.disabilityPercent = 'Escribe un porcentaje entre 1 y 100'
  if (d.validity && d.validity !== 'indefinite' && !isIsoDate(d.validity))
    e.validity = 'Escribe la fecha así: 12/03/2030, o “Indefinida”'
  return e
}

/**
 * Paso 1: fotos del carnet (frente y reverso) → OCR del back → la persona revisa y confirma.
 * Si la lectura falla (IA no disponible, foto borrosa), puede escribir sus datos a mano.
 */
export function IdCardStep() {
  const navigate = useNavigate()
  const saved = useSignupStore((s) => s.idCard)
  const saveIdCard = useSignupStore((s) => s.saveIdCard)
  const markCompleted = useSignupStore((s) => s.markCompleted)
  const setStepError = useSignupStore((s) => s.setStepError)
  const photos = useIdCardPhotos()
  const { data: catalog } = useCatalog()
  const disabilityOptions = catalog?.disabilityTypes ?? [...DISABILITY_TYPES]

  const [data, setData] = useState<IdCardData>(saved.data)
  const [editing, setEditing] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Errors>({})
  const hasData = Boolean(saved.scanId) || editing
  const set = <K extends keyof IdCardData>(k: K, v: IdCardData[K]) => setData((p) => ({ ...p, [k]: v }))

  const scan = async () => {
    if (!photos.front || !photos.back) return
    setScanning(true)
    setScanError(null)
    try {
      const r = await scanIdCard(photos.front.blob, photos.back.blob)
      const next: IdCardData = {
        fullName: r.fullName ?? '',
        idNumber: r.idNumber ?? '',
        birthDate: r.birthDate ?? '',
        disabilityType: r.disabilityType,
        disabilityPercent: r.disabilityPercent,
        validity: r.validity ?? '',
      }
      setData(next)
      saveIdCard({ scanId: r.scanId, scanExpiresAt: r.expiresAt, data: next, needsReview: r.needsReview, confirmed: false })
      setEditing(r.needsReview.length > 0)
      setStepError(null)
      if (r.ocrFailed) {
        setScanError('No pudimos leer tu carnet en este momento. Guardamos tus fotos: escribe tus datos abajo.')
      }
    } catch (e) {
      const unavailable = e instanceof ApiError && (e.status === 503 || e.code === 'IA_UNAVAILABLE')
      setScanError(
        unavailable
          ? 'No pudimos leer tu carnet en este momento. Escribe tus datos abajo; los revisaremos después.'
          : `${errorMessage(e)} Puedes tomar las fotos otra vez o escribir tus datos.`,
      )
      setEditing(true)
    } finally {
      setScanning(false)
    }
  }

  const next = () => {
    const e = validate(data)
    setErrors(e)
    if (Object.keys(e).length) {
      setEditing(true)
      focusFirstInvalid()
      return
    }
    saveIdCard({ data: { ...data, fullName: data.fullName.trim() }, confirmed: true })
    markCompleted(1)
    setStepError(null)
    navigate('/signup/contact')
  }

  const review = (k: IdCardField) => saved.needsReview.includes(k)

  return (
    <StepFrame
      step={1}
      title="Tu carnet"
      lead="Toma una foto de tu carnet de discapacidad por los dos lados. Leemos tus datos para que no tengas que escribirlos."
    >
      <div className="step">
        <div className="idcard-tiles">
          <PhotoTile side="front" />
          <PhotoTile side="back" />
        </div>

        {!saved.scanId && (
          <Button onPress={scan} isDisabled={!photos.front || !photos.back || scanning} fullWidth>
            {scanning ? 'Leyendo tu carnet…' : 'Leer mis datos'}
          </Button>
        )}
        <p className="sr-only" aria-live="polite">
          {scanning ? 'Leyendo tu carnet, espera un momento.' : saved.scanId ? 'Listo. Leímos estos datos.' : ''}
        </p>

        {scanError && (
          <p role="alert" className="step__alert">
            {scanError}
          </p>
        )}

        {(hasData || scanError) && (
          <section className="idcard-data" aria-labelledby="idcard-data-title">
            <div className="idcard-data__head">
              <h2 id="idcard-data-title" className="idcard-data__title">
                {saved.scanId && !scanError ? 'Leímos estos datos' : 'Escribe tus datos del carnet'}
              </h2>
              {saved.scanId && !editing && (
                <Button variant="ghost" onPress={() => setEditing(true)}>
                  Corregir datos
                </Button>
              )}
            </div>

            {editing ? (
              <div className="step__grid step__grid--2">
                <Field label="Nombre" value={data.fullName} onChange={(v) => set('fullName', v)} autoComplete="name" error={errors.fullName} hint={review('fullName') ? 'Revisa este dato' : undefined} />
                <Field
                  label="Cédula"
                  inputMode="numeric"
                  value={data.idNumber}
                  onChange={(v) => set('idNumber', v.replace(/\D/g, '').slice(0, 10))}
                  error={errors.idNumber}
                  hint={review('idNumber') ? 'Revisa este dato' : '10 dígitos'}
                />
                <Field
                  label="Fecha de nacimiento"
                  placeholder="12/03/1985"
                  value={showDate(data.birthDate)}
                  onChange={(v) => set('birthDate', parseDate(v))}
                  error={errors.birthDate}
                  hint={review('birthDate') ? 'Revisa este dato' : 'Día/mes/año'}
                />
                <Field
                  label="Porcentaje de discapacidad"
                  inputMode="numeric"
                  value={data.disabilityPercent ? String(data.disabilityPercent) : ''}
                  onChange={(v) => {
                    const n = parseInt(v.replace(/\D/g, '').slice(0, 3), 10)
                    set('disabilityPercent', Number.isNaN(n) ? null : n)
                  }}
                  error={errors.disabilityPercent}
                  hint={review('disabilityPercent') ? 'Revisa este dato' : undefined}
                />
                <Field
                  label="Vigencia"
                  placeholder="12/03/2030 o Indefinida"
                  value={showValidity(data.validity)}
                  onChange={(v) => set('validity', /^indef/i.test(v.trim()) ? 'indefinite' : parseDate(v))}
                  error={errors.validity}
                  hint={review('validity') ? 'Revisa este dato' : undefined}
                />
                <div className={review('disabilityType') ? 'idcard-review' : undefined}>
                  <ChipGroup<DisabilityType>
                    label="Tipo de discapacidad"
                    labelHint={review('disabilityType') ? 'Revisa este dato' : undefined}
                    selectionMode="single"
                    options={disabilityOptions}
                    value={data.disabilityType}
                    onChange={(v) => v && set('disabilityType', v)}
                  />
                  {errors.disabilityType && (
                    <p className="ui-field__error" aria-invalid="true" tabIndex={-1}>
                      ⚠ {errors.disabilityType}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <dl className="idcard-grid">
                {(
                  [
                    ['fullName', 'Nombre', data.fullName],
                    ['idNumber', 'Cédula', data.idNumber],
                    ['birthDate', 'Fecha nac.', showDate(data.birthDate)],
                    ['disabilityType', 'Tipo', disabilityOptions.find((o) => o.value === data.disabilityType)?.label ?? ''],
                    ['disabilityPercent', '%', data.disabilityPercent ? `${data.disabilityPercent} %` : ''],
                    ['validity', 'Vigencia', showValidity(data.validity)],
                  ] as const
                ).map(([k, label, value]) => (
                  <div key={k} className={`idcard-grid__item${review(k) ? ' is-review' : ''}`}>
                    <dt>{label}</dt>
                    <dd>{value || '—'}</dd>
                    {review(k) && <span className="idcard-grid__flag">Revisa este dato</span>}
                  </div>
                ))}
              </dl>
            )}
            {saved.scanId && (
              <p className="step__note">
                <CheckIcon size={16} /> La empresa nunca ve tu carnet ni tu diagnóstico.
              </p>
            )}
          </section>
        )}

        {!hasData && !scanError && (
          <Button variant="ghost" onPress={() => { setData(emptyIdCard); setEditing(true) }}>
            Prefiero escribir mis datos
          </Button>
        )}

        <aside className="idcard-help" aria-labelledby="no-card-title">
          <h2 id="no-card-title" className="idcard-help__title">¿No tienes carnet?</h2>
          <p>
            El carnet de discapacidad es gratuito. Lo obtienes con la calificación del Ministerio de Salud Pública (MSP).
          </p>
          <ul>
            <li>
              <a href="https://www.salud.gob.ec/calificacion-o-recalificacion-de-personas-con-discapacidad/" target="_blank" rel="noreferrer">
                Cómo sacar el carnet en el MSP (se abre en otra pestaña)
              </a>
            </li>
            <li>
              <a href="https://www.consejodiscapacidades.gob.ec/" target="_blank" rel="noreferrer">
                Información del CONADIS (se abre en otra pestaña)
              </a>
            </li>
          </ul>
        </aside>

        <div className="step__footer">
          <Button variant="secondary" onPress={() => navigate('/')}>
            Volver al inicio
          </Button>
          <Button className="step__next" onPress={next} isDisabled={!hasData && !scanError}>
            {editing ? 'Confirmar y continuar' : 'Mis datos están bien'} <ArrowRightIcon />
          </Button>
        </div>
        <p className="step__note">Tus datos se guardan si sales.</p>
      </div>
    </StepFrame>
  )
}

/** Foto de un lado del carnet: tomar con la cámara, subir archivo o arrastrar y soltar. */
function PhotoTile({ side }: { side: Side }) {
  const photo = useIdCardPhotos((s) => s[side])
  const setPhoto = useIdCardPhotos((s) => s.setPhoto)
  const saveIdCard = useSignupStore((s) => s.saveIdCard)
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const label = SIDE_LABEL[side]
  const inputId = `idcard-${side}`

  const take = (f: File | undefined | null) => {
    if (!f || !f.type.startsWith('image/')) return
    setPhoto(side, f)
    // Foto nueva: hay que volver a leer el carnet
    saveIdCard({ scanId: null, needsReview: [], confirmed: false })
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    take(e.dataTransfer.files[0])
  }

  return (
    // Zona para soltar la foto (arrastrar es un extra del mouse; los botones de adentro son el camino accesible)
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="group"
      aria-label={`Foto del ${label.toLowerCase()} del carnet`}
      className={`idcard-tile${photo ? ' has-photo' : ''}${over ? ' is-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <p className="idcard-tile__title">
        {label} {photo && <CheckIcon size={18} aria-label="(foto lista)" />}
      </p>
      {photo ? (
        <img src={photo.url} alt={`Foto del ${label.toLowerCase()} de tu carnet`} className="idcard-tile__img" />
      ) : (
        <div className="idcard-tile__empty" aria-hidden="true">
          Arrastra aquí la foto
        </div>
      )}
      <div className="idcard-tile__actions">
        <Link to={`/signup/id-card/camera?side=${side}`} className="ui-button ui-button--primary">
          {photo ? 'Tomar otra' : 'Tomar foto'}
        </Link>
        <input
          ref={inputRef}
          id={inputId}
          className="sr-only"
          type="file"
          accept={IMAGE_TYPES}
          onChange={(e) => take(e.target.files?.[0])}
        />
        <label htmlFor={inputId} className="cv-upload__label">
          Elegir de la galería ({label.toLowerCase()})
        </label>
      </div>
    </div>
  )
}
