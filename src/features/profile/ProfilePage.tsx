import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button, ChipGroup } from '@/shared/ui'
import { VoiceField } from '@/shared/voice/VoiceField'
import { api, errorMessage } from '@/shared/api/client'
import { useMe } from '@/features/auth/api'
import { useSession } from '@/features/auth/useSession'
import type { Profile } from '@/shared/api/types'
import { useCatalog } from '@/shared/api/catalog'
import { ACCOMMODATIONS, EDUCATION_LEVELS, SKILLS, type Accommodation, type EducationLevel, type Skill } from '@/features/signup/options'
import '@/features/signup/signup.css'
import './profile.css'

type WorkExperience = Profile['experience']

const emptyExperience: WorkExperience = {
  hasWorked: null,
  experienceText: '',
  cvFileName: '',
  education: null,
  skills: [],
  accommodationsNeeded: [],
  otherAccommodation: '',
}

export function ProfilePage() {
  const queryClient = useQueryClient()
  const sessionProfile = useSession((s) => s.profile)
  const { data: profile, isLoading } = useMe()
  const { data: catalog } = useCatalog()
  const [experience, setExperience] = useState<WorkExperience>(sessionProfile?.experience ?? emptyExperience)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) setExperience(profile.experience)
  }, [profile])

  const set = <K extends keyof WorkExperience>(key: K, value: WorkExperience[K]) =>
    setExperience((current) => ({ ...current, [key]: value }))

  const save = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const updated = await api<Profile>('/me', { method: 'PATCH', body: { experience } })
      useSession.getState().setProfile(updated)
      queryClient.setQueryData(['me'], updated)
      await queryClient.invalidateQueries({ queryKey: ['matches'] })
      setMessage('Tu perfil de trabajo se guardó. Tus recomendaciones fueron actualizadas.')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading && !profile && !sessionProfile) return <main className="profile-page"><p>Cargando tu perfil…</p></main>

  return (
    <main className="profile-page">
      <div className="profile-page__inner">
        <header className="profile-page__header">
          <h1>Mi perfil de trabajo</h1>
          <p>Actualiza lo que sabes hacer y los ajustes que necesitas. Esto cambia tus recomendaciones.</p>
        </header>

        <section className="profile-page__card" aria-labelledby="work-profile-title">
          <h2 id="work-profile-title">Tu experiencia</h2>
          <ChipGroup
            label="¿Has trabajado antes?"
            selectionMode="single"
            variant="large"
            options={[
              { value: 'yes', label: 'Sí, he trabajado' },
              { value: 'no', label: 'No, sería mi primer empleo' },
            ]}
            value={experience.hasWorked}
            onChange={(value) => set('hasWorked', value)}
          />

          {experience.hasWorked !== 'no' && (
            <VoiceField
              kind="longText"
              label="Cuéntanos qué sabes hacer"
              placeholder="Ej.: Trabajé en atención al cliente y manejo Excel."
              value={experience.experienceText}
              onChange={(value) => set('experienceText', value)}
            />
          )}

          <ChipGroup<EducationLevel>
            label="¿Hasta dónde estudiaste?"
            selectionMode="single"
            options={catalog?.educationLevels ?? [...EDUCATION_LEVELS]}
            value={experience.education}
            onChange={(value) => set('education', value)}
          />

          <ChipGroup<Skill>
            label="¿Qué sabes hacer?"
            selectionMode="multiple"
            options={catalog?.skills ?? [...SKILLS]}
            value={experience.skills}
            onChange={(value) => set('skills', value)}
          />

          <ChipGroup<Accommodation>
            label="¿Qué ajustes necesitas en un trabajo?"
            labelHint="(opcional)"
            selectionMode="multiple"
            options={catalog?.accommodations ?? [...ACCOMMODATIONS]}
            value={experience.accommodationsNeeded}
            onChange={(value) => set('accommodationsNeeded', value)}
          />

          <VoiceField
            kind="longText"
            multiline={false}
            label="Otro ajuste"
            placeholder="Escribe o dicta otro ajuste"
            value={experience.otherAccommodation}
            onChange={(value) => set('otherAccommodation', value)}
          />

          {error && <p className="profile-page__message profile-page__message--error" role="alert">{error}</p>}
          {message && <p className="profile-page__message" role="status">{message}</p>}

          <div className="profile-page__actions">
            <Button onPress={() => void save()} isDisabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
