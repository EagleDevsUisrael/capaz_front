import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, ChipGroup } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { VoiceField } from '@/shared/voice/VoiceField'
import { errorMessage } from '@/shared/api/client'
import { useCatalog } from '@/shared/api/catalog'
import { uploadCv } from './api'
import { ACCOMMODATIONS, EDUCATION_LEVELS, SKILLS, type Accommodation, type Skill } from './options'
import { StepFrame } from './StepFrame'
import { useSignupStore } from './useSignupStore'

/**
 * Paso 3: todo opcional (se puede saltar). Estudios, habilidades y ajustes son chips;
 * la experiencia y "otro ajuste" se pueden dictar. Los ajustes alimentan el match (accommodationsNeeded).
 */
export function ExperienceStep() {
  const navigate = useNavigate()
  const saved = useSignupStore((s) => s.experience)
  const saveExperience = useSignupStore((s) => s.saveExperience)
  const markCompleted = useSignupStore((s) => s.markCompleted)
  const [v, setV] = useState(saved)
  const set = <K extends keyof typeof v>(key: K, value: (typeof v)[K]) => setV((p) => ({ ...p, [key]: value }))

  const cvUploadId = useSignupStore((s) => s.cvUploadId)
  const saveCvUpload = useSignupStore((s) => s.saveCvUpload)
  const setStepError = useSignupStore((s) => s.setStepError)
  const [cvBusy, setCvBusy] = useState(false)
  const [cvError, setCvError] = useState<string | null>(null)
  const { data: catalog } = useCatalog()

  const onCv = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return setCvError('El archivo pesa más de 10 MB. Prueba con uno más liviano.')
    setCvBusy(true)
    setCvError(null)
    try {
      const r = await uploadCv(file)
      saveCvUpload(r.cvUploadId)
      setV((p) => ({ ...p, cvFileName: r.fileName }))
    } catch (e) {
      setCvError(errorMessage(e))
    } finally {
      setCvBusy(false)
    }
  }

  const next = () => {
    setStepError(null)
    saveExperience(v)
    markCompleted(3)
    navigate('/signup/privacy')
  }

  return (
    <StepFrame
      step={3}
      title="Tu experiencia"
      lead="Cuéntanos qué sabes hacer y qué necesitas para trabajar cómodo. Si nunca has trabajado, no pasa nada. Todo este paso es opcional."
    >
      <div className="step">
        <ChipGroup
          label="¿Has trabajado antes?"
          selectionMode="single"
          variant="large"
          options={[
            { value: 'yes', label: 'Sí, he trabajado' },
            { value: 'no', label: 'No, sería mi primer empleo' },
          ]}
          value={v.hasWorked}
          onChange={(x) => set('hasWorked', x)}
        />

        {v.hasWorked !== 'no' && (
          <div className="step">
            <VoiceField
              kind="longText"
              label="Cuéntanos qué hiciste"
              placeholder="Ej.: Trabajé dos años en un call center atendiendo reclamos."
              value={v.experienceText}
              onChange={(x) => set('experienceText', x)}
            />
            {/* La hoja de vida se sube ya (POST /api/cv-uploads) y se vincula al crear la cuenta con cvUploadId */}
            <div className="cv-upload">
              <input
                id="cv-file"
                className="sr-only"
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => void onCv(e.target.files?.[0])}
              />
              <label htmlFor="cv-file" className="cv-upload__label">
                📎 {v.cvFileName ? `Hoja de vida: ${v.cvFileName} (cambiar)` : '¿Tienes hoja de vida? Súbela aquí (opcional)'}
              </label>
              <p className="step__note" role="status" aria-live="polite">
                {cvBusy ? 'Subiendo tu hoja de vida…' : v.cvFileName && cvUploadId ? 'Hoja de vida subida.' : 'PDF, Word, JPG o PNG de hasta 10 MB.'}
              </p>
              {cvError && (
                <p role="alert" className="step__alert">
                  {cvError}
                </p>
              )}
            </div>
          </div>
        )}

        <ChipGroup
          label="¿Hasta dónde estudiaste?"
          selectionMode="single"
          options={catalog?.educationLevels ?? [...EDUCATION_LEVELS]}
          value={v.education}
          onChange={(x) => set('education', x)}
        />

        <ChipGroup<Skill>
          label="¿Qué sabes hacer? Elige las que quieras"
          selectionMode="multiple"
          options={catalog?.skills ?? [...SKILLS]}
          value={v.skills}
          onChange={(x) => set('skills', x)}
        />

        <div className="step">
          <ChipGroup<Accommodation>
            label="¿Qué ajustes necesitas en un trabajo?"
            labelHint="(opcional)"
            selectionMode="multiple"
            options={catalog?.accommodations ?? [...ACCOMMODATIONS]}
            value={v.accommodationsNeeded}
            onChange={(x) => set('accommodationsNeeded', x)}
          />
          <VoiceField
            kind="longText"
            multiline={false}
            label="Otro ajuste"
            placeholder="¿Otro ajuste? Escríbelo o díctalo"
            hint="Con tus ajustes, las recomendaciones son mucho más precisas."
            value={v.otherAccommodation}
            onChange={(x) => set('otherAccommodation', x)}
          />
        </div>

        <div className="step__footer">
          <Button variant="secondary" onPress={() => navigate('/signup/contact')}>
            Volver al paso 2
          </Button>
          <Button variant="ghost" onPress={() => navigate('/signup/privacy')}>
            Saltar este paso
          </Button>
          <Button className="step__next" onPress={next}>
            Continuar al paso 4 <ArrowRightIcon />
          </Button>
        </div>
      </div>
    </StepFrame>
  )
}
