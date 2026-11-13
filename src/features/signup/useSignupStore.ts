import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Accommodation, ContactPreference, EducationLevel, Skill } from './options'

export interface PendingJob {
  id: string
  title: string
  /** "Banco del Litoral · Teletrabajo" */
  subtitle: string
}

export interface SignupState {
  /** Oferta a la que la persona quiere postular (se muestra en la barra lateral del registro) */
  pendingJob: PendingJob | null

  contact: {
    fullName: string
    phone: string
    email: string
    city: string
    preferred: ContactPreference
  }

  experience: {
    hasWorked: 'yes' | 'no' | null
    experienceText: string
    cvFileName: string
    education: EducationLevel | null
    skills: Skill[]
    accommodationsNeeded: Accommodation[]
    otherAccommodation: string
  }

  privacy: {
    /** Obligatorio para usar Capaz: siempre verdadero */
    useProfile: true
    /** La empresa ve solo los ajustes que la persona necesita */
    shareOnlyAccommodations: boolean
    /** Que las empresas la encuentren sin postular */
    discoverable: boolean
    /** Cuándo dio su consentimiento (la ley exige poder demostrarlo) */
    consentAt: string | null
  }

  /** Pasos completados, para marcar el ✓ en la barra lateral */
  completed: number[]
}

interface SignupActions {
  setPendingJob: (job: PendingJob | null) => void
  saveContact: (v: SignupState['contact']) => void
  saveExperience: (v: SignupState['experience']) => void
  savePrivacy: (v: Omit<SignupState['privacy'], 'useProfile' | 'consentAt'>) => void
  markCompleted: (step: number) => void
  reset: () => void
}

const initial: SignupState = {
  pendingJob: null,
  contact: { fullName: '', phone: '', email: '', city: '', preferred: 'whatsapp' },
  experience: {
    hasWorked: null,
    experienceText: '',
    cvFileName: '',
    education: null,
    skills: [],
    accommodationsNeeded: [],
    otherAccommodation: '',
  },
  // Privacidad por defecto: la empresa ve solo los ajustes y NO te encuentra sin postular
  privacy: { useProfile: true, shareOnlyAccommodations: true, discoverable: false, consentAt: null },
  completed: [],
}

/**
 * Datos del registro de 4 pasos. Se guardan en sessionStorage ("Tus datos se guardan si sales"):
 * sobreviven a recargar la página, pero se borran al cerrar la pestaña.
 * Cuando exista el backend, el envío final reemplaza esto (aquí no hay carnet ni diagnóstico).
 */
export const useSignupStore = create<SignupState & SignupActions>()(
  persist(
    (set) => ({
      ...initial,
      setPendingJob: (pendingJob) => set({ pendingJob }),
      saveContact: (contact) => set({ contact }),
      saveExperience: (experience) => set({ experience }),
      savePrivacy: (p) =>
        set((s) => ({ privacy: { ...s.privacy, ...p, useProfile: true, consentAt: new Date().toISOString() } })),
      markCompleted: (step) => set((s) => ({ completed: s.completed.includes(step) ? s.completed : [...s.completed, step] })),
      reset: () => set(initial),
    }),
    { name: 'capaz-signup', storage: createJSONStorage(() => sessionStorage) },
  ),
)
