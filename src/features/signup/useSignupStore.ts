import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DisabilityType } from '@/shared/api/types'
import type { Accommodation, ContactPreference, EducationLevel, Skill } from './options'

export interface PendingJob {
  id: string
  title: string
  /** "Banco del Litoral · Teletrabajo" */
  subtitle: string
}

/** Campos del carnet que lee el OCR (mismos nombres que el back) */
export type IdCardField = 'fullName' | 'idNumber' | 'birthDate' | 'disabilityType' | 'disabilityPercent' | 'validity'

export interface IdCardData {
  fullName: string
  idNumber: string
  /** AAAA-MM-DD o vacío */
  birthDate: string
  disabilityType: DisabilityType | null
  disabilityPercent: number | null
  /** AAAA-MM-DD, "indefinite" o vacío */
  validity: string
}

/** Error del envío final que hay que corregir en un paso anterior */
export interface StepError {
  step: number
  message: string
  fields?: Record<string, string>
}

export interface SignupState {
  /** Oferta a la que la persona quiere postular (se muestra en la barra lateral del registro) */
  pendingJob: PendingJob | null

  /** Paso 1: escaneo del carnet (POST /api/id-card/scan) y datos confirmados por la persona */
  idCard: {
    scanId: string | null
    /** Cuándo vence el escaneo (2 h): después hay que volver a subir las fotos */
    scanExpiresAt: string | null
    data: IdCardData
    /** Campos que el OCR leyó con poca confianza ("Revisa este dato") */
    needsReview: IdCardField[]
    /** La persona confirmó (o escribió) los datos */
    confirmed: boolean
  }

  contact: {
    fullName: string
    phone: string
    email: string
    city: string
    preferred: ContactPreference
  }

  /** Paso 2: verificación del celular (POST /api/phone-verifications/:id/verify) */
  phoneVerification: { id: string; phone: string; usableUntil: string } | null

  experience: {
    hasWorked: 'yes' | 'no' | null
    experienceText: string
    cvFileName: string
    education: EducationLevel | null
    skills: Skill[]
    accommodationsNeeded: Accommodation[]
    otherAccommodation: string
  }

  /** Paso 3: hoja de vida subida antes de tener cuenta (POST /api/cv-uploads) */
  cvUploadId: string | null

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

  /** Error del envío final que se muestra en el paso que hay que corregir */
  stepError: StepError | null

  /** Pasos completados, para marcar el ✓ en la barra lateral */
  completed: number[]
}

interface SignupActions {
  setPendingJob: (job: PendingJob | null) => void
  saveIdCard: (v: Partial<SignupState['idCard']>) => void
  saveContact: (v: SignupState['contact']) => void
  savePhoneVerification: (v: SignupState['phoneVerification']) => void
  saveExperience: (v: SignupState['experience']) => void
  saveCvUpload: (id: string | null) => void
  savePrivacy: (v: Omit<SignupState['privacy'], 'useProfile' | 'consentAt'>) => void
  setStepError: (e: StepError | null) => void
  markCompleted: (step: number) => void
  reset: () => void
}

export const emptyIdCard: IdCardData = {
  fullName: '',
  idNumber: '',
  birthDate: '',
  disabilityType: null,
  disabilityPercent: null,
  validity: '',
}

const initial: SignupState = {
  pendingJob: null,
  idCard: { scanId: null, scanExpiresAt: null, data: emptyIdCard, needsReview: [], confirmed: false },
  contact: { fullName: '', phone: '', email: '', city: '', preferred: 'whatsapp' },
  phoneVerification: null,
  experience: {
    hasWorked: null,
    experienceText: '',
    cvFileName: '',
    education: null,
    skills: [],
    accommodationsNeeded: [],
    otherAccommodation: '',
  },
  cvUploadId: null,
  // Privacidad por defecto: la empresa ve solo los ajustes y NO te encuentra sin postular
  privacy: { useProfile: true, shareOnlyAccommodations: true, discoverable: false, consentAt: null },
  stepError: null,
  completed: [],
}

/**
 * Datos del registro de 4 pasos. Se guardan en sessionStorage ("Tus datos se guardan si sales"):
 * sobreviven a recargar la página, pero se borran al cerrar la pestaña.
 * El envío final es POST /api/signup (PrivacyStep). Las fotos del carnet NO se guardan aquí (ver idCardPhotos.ts).
 */
export const useSignupStore = create<SignupState & SignupActions>()(
  persist(
    (set) => ({
      ...initial,
      setPendingJob: (pendingJob) => set({ pendingJob }),
      saveIdCard: (v) => set((s) => ({ idCard: { ...s.idCard, ...v } })),
      saveContact: (contact) => set({ contact }),
      savePhoneVerification: (phoneVerification) => set({ phoneVerification }),
      saveExperience: (experience) => set({ experience }),
      saveCvUpload: (cvUploadId) => set({ cvUploadId }),
      savePrivacy: (p) =>
        set((s) => ({ privacy: { ...s.privacy, ...p, useProfile: true, consentAt: new Date().toISOString() } })),
      setStepError: (stepError) => set({ stepError }),
      markCompleted: (step) => set((s) => ({ completed: s.completed.includes(step) ? s.completed : [...s.completed, step] })),
      reset: () => set(initial),
    }),
    {
      name: 'capaz-signup',
      version: 2,
      storage: createJSONStorage(() => sessionStorage),
      // Registros guardados antes de conectar el back: se completan con los campos nuevos
      migrate: (old) => ({ ...initial, ...(old as Partial<SignupState>) }) as SignupState & SignupActions,
    },
  ),
)
