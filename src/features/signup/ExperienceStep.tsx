import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, ChipGroup } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { VoiceField } from '@/shared/voice/VoiceField'
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

  const next = () => {
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
            {/* TODO(backend): subir y analizar la hoja de vida. Por ahora solo se guarda el nombre del archivo. */}
            <div className="cv-upload">
              <input
                id="cv-file"
                className="sr-only"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => set('cvFileName', e.target.files?.[0]?.name ?? '')}
              />
              <label htmlFor="cv-file" className="cv-upload__label">
                📎 {v.cvFileName ? `Hoja de vida: ${v.cvFileName}` : '¿Tienes hoja de vida? Súbela aquí (opcional)'}
              </label>
            </div>
          </div>
        )}

        <ChipGroup
          label="¿Hasta dónde estudiaste?"
          selectionMode="single"
          options={[...EDUCATION_LEVELS]}
          value={v.education}
          onChange={(x) => set('education', x)}
        />

        <ChipGroup<Skill>
          label="¿Qué sabes hacer? Elige las que quieras"
          selectionMode="multiple"
          options={[...SKILLS]}
          value={v.skills}
          onChange={(x) => set('skills', x)}
        />

        <div className="step">
          <ChipGroup<Accommodation>
            label="¿Qué ajustes necesitas en un trabajo?"
            labelHint="(opcional)"
            selectionMode="multiple"
            options={[...ACCOMMODATIONS]}
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
