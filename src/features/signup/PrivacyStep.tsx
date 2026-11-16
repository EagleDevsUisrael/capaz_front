import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSession } from '@/features/auth/useSession'
import { ApiError, errorMessage } from '@/shared/api/client'
import { labelIn, useCatalog } from '@/shared/api/catalog'
import { Button, Switch } from '@/shared/ui'
import { ShieldCheckIcon } from '@/shared/ui/icons'
import { previewCompanyView, submitSignup } from './api'
import { ACCOMMODATIONS, EDUCATION_LEVELS, labelOf } from './options'
import { StepFrame } from './StepFrame'
import { SIGNUP_STEPS } from './steps'
import { useSignupStore, type SignupState } from './useSignupStore'

/** Paso del registro al que pertenece un error del back (por el campo o por el código) */
function stepOf(e: ApiError): number {
  const keys = Object.keys(e.fields ?? {})
  const has = (...prefixes: string[]) => keys.some((k) => prefixes.some((p) => k === p || k.startsWith(`${p}.`)))
  if (e.code === 'PHONE_NOT_VERIFIED' || has('contact', 'phoneVerificationId')) return 2
  if (e.code === 'CV_UPLOAD_NOT_FOUND' || has('experience', 'cvUploadId')) return 3
  if (e.code === 'SCAN_EXPIRED' || e.status === 404 || has('idCard', 'scanId')) return 1
  return 4
}

/** Cuerpo de POST /api/signup a partir de lo guardado en los pasos 1–4 */
function signupBody(s: SignupState, privacy: { shareOnlyAccommodations: boolean; discoverable: boolean }) {
  const d = s.idCard.data
  return {
    scanId: s.idCard.scanId,
    idCard: {
      fullName: d.fullName,
      idNumber: d.idNumber,
      birthDate: d.birthDate || null,
      disabilityType: d.disabilityType,
      disabilityPercent: d.disabilityPercent,
      validity: d.validity || null,
    },
    contact: s.contact,
    phoneVerificationId: s.phoneVerification?.id,
    experience: s.experience,
    privacy: { useProfile: true, ...privacy, keepIdCardImages: false },
    applyToJobId: s.pendingJob?.id ?? null,
    cvUploadId: s.cvUploadId,
  }
}

/**
 * Paso 4: consentimiento explícito (Ley Orgánica de Protección de Datos Personales).
 * La vista previa la calcula el back (POST /api/company-view/preview) y el registro se envía a POST /api/signup.
 * La empresa nunca ve el carnet, el diagnóstico ni el porcentaje.
 */
export function PrivacyStep() {
  const navigate = useNavigate()
  const contact = useSignupStore((s) => s.contact)
  const experience = useSignupStore((s) => s.experience)
  const idCard = useSignupStore((s) => s.idCard)
  const saved = useSignupStore((s) => s.privacy)
  const savePrivacy = useSignupStore((s) => s.savePrivacy)
  const markCompleted = useSignupStore((s) => s.markCompleted)
  const setStepError = useSignupStore((s) => s.setStepError)
  const { data: catalog } = useCatalog()

  const [shareOnly, setShareOnly] = useState(saved.shareOnlyAccommodations)
  const [discoverable, setDiscoverable] = useState(saved.discoverable)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ message: string; login?: boolean } | null>(null)

  const preview = useQuery({
    queryKey: ['company-view-preview', contact.fullName, contact.city, experience, shareOnly, idCard.data.disabilityType],
    enabled: contact.fullName.trim().length >= 3 && contact.city.trim().length >= 2,
    queryFn: ({ signal }) =>
      previewCompanyView(
        {
          contact: { fullName: contact.fullName, city: contact.city },
          experience,
          privacy: { shareOnlyAccommodations: shareOnly },
          idCard: idCard.data.disabilityType
            ? { disabilityType: idCard.data.disabilityType, disabilityPercent: idCard.data.disabilityPercent ?? undefined }
            : undefined,
        },
        signal,
      ),
    placeholderData: (prev) => prev,
  })

  const finish = async () => {
    savePrivacy({ shareOnlyAccommodations: shareOnly, discoverable })
    const state = useSignupStore.getState()
    // Antes de enviar: lo que sabemos que falta lleva directo al paso que hay que completar
    const missing = !state.idCard.scanId || !state.idCard.confirmed ? 1 : !state.phoneVerification ? 2 : 0
    if (missing) {
      setStepError({
        step: missing,
        message:
          missing === 1
            ? 'Necesitamos leer las fotos de tu carnet y que confirmes tus datos.'
            : 'Confirma tu celular con el código de 4 dígitos.',
      })
      return navigate(SIGNUP_STEPS[missing - 1].path)
    }

    setBusy(true)
    setError(null)
    try {
      const r = await submitSignup(signupBody(state, { shareOnlyAccommodations: shareOnly, discoverable }))
      markCompleted(4)
      useSession.getState().signIn({ token: r.token, expiresAt: r.expiresAt, profile: r.candidate })
      state.reset()
      navigate(r.applicationId ? `/applications/${r.applicationId}/sent` : '/for-you', { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ALREADY_REGISTERED') {
        setError({ message: e.message, login: true })
      } else if (e instanceof ApiError && e.status !== 0 && stepOf(e) !== 4) {
        const step = stepOf(e)
        // Lo que ya no sirve se borra para pedirlo otra vez
        if (step === 1) state.saveIdCard({ scanId: null, confirmed: false })
        if (step === 2) state.savePhoneVerification(null)
        if (step === 3) state.saveCvUpload(null)
        setStepError({ step, message: e.message, fields: e.fields })
        navigate(SIGNUP_STEPS[step - 1].path)
      } else {
        setError({ message: errorMessage(e) })
      }
    } finally {
      setBusy(false)
    }
  }

  // Mientras llega la vista previa del back, se arma con los datos locales
  const view = preview.data
  const headline =
    view?.headline ?? [contact.city, labelOf(EDUCATION_LEVELS, experience.education)].filter(Boolean).join(' · ')
  const needs = (view?.accommodationsNeeded ?? experience.accommodationsNeeded).map((a) =>
    catalog ? labelIn(catalog.accommodations, a) : labelOf(ACCOMMODATIONS, a),
  )

  return (
    <StepFrame
      step={4}
      title="Tú decides qué se comparte"
      lead="Tus datos de salud son datos sensibles según la Ley Orgánica de Protección de Datos Personales. Nunca los vendemos ni los mostramos sin tu permiso."
    >
      <div className="step">
        <div className="privacy-card">
          <Switch
            label="Usar mi perfil para recomendarme empleos"
            description="Necesario para que la plataforma funcione. (obligatorio)"
            isSelected
            isReadOnly
          />
          <Switch
            label="Mostrar a la empresa solo los ajustes que necesito"
            description="La empresa no ve tu carnet, tu diagnóstico ni tu porcentaje."
            isSelected={shareOnly}
            onChange={setShareOnly}
          />
          <Switch
            label="Que las empresas me encuentren sin postular"
            description="Te pueden invitar a ofertas nuevas."
            isSelected={discoverable}
            onChange={setDiscoverable}
          />
        </div>

        <section className="privacy-preview" aria-labelledby="preview-title" aria-busy={preview.isFetching}>
          <h2 id="preview-title" className="privacy-preview__title">Así te verá la empresa</h2>
          <p className="privacy-preview__name">{view?.fullName || contact.fullName || 'Tu nombre'}</p>
          {headline && <p className="privacy-preview__summary">{headline}</p>}
          {needs.length > 0 && (
            <div>
              <p className="privacy-preview__label">Ajustes que necesita:</p>
              <ul className="privacy-preview__tags">
                {needs.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          {view?.disability ? (
            <p className="privacy-preview__summary">
              Discapacidad: {labelIn(catalog?.disabilityTypes, view.disability.type)}
              {view.disability.percent ? ` (${view.disability.percent} %)` : ''}
            </p>
          ) : (
            <p className="privacy-preview__hidden">
              <ShieldCheckIcon size={20} /> Carnet y diagnóstico ocultos
            </p>
          )}
        </section>

        <p className="step__note">
          Puedes cambiar estos permisos o borrar tu cuenta y todos tus datos cuando quieras, desde “Mi perfil”.
        </p>

        {error && (
          <p role="alert" className="step__alert">
            {error.message} {error.login && <Link to="/login">Ingresar con mi cédula</Link>}
          </p>
        )}

        <div className="step__footer">
          <Button variant="secondary" onPress={() => navigate('/signup/experience')}>
            Volver al paso 3
          </Button>
          <Button className="step__next" onPress={finish} isDisabled={busy}>
            {busy ? 'Creando tu cuenta…' : 'Ver mis trabajos'}
          </Button>
        </div>
      </div>
    </StepFrame>
  )
}
