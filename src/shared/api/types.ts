/**
 * Tipos del contrato de capaz_backend (fuente: capaz_backend/openapi.json y src/modules/dto.ts).
 * Si el back cambia, se actualiza aquí. Los tipos de cada pantalla viven en su carpeta de feature.
 */

export type DisabilityType = 'physical' | 'visual' | 'hearing' | 'intellectual' | 'psychosocial'
export type Modality = 'onSite' | 'remote' | 'hybrid'
export type Schedule = 'fullTime' | 'partTime' | 'internship'
export type JobFeature = 'remote' | 'wheelchair' | 'screenReader' | 'signLanguage' | 'flexibleSchedule'
export type SalaryRange = '470-600' | '600-900' | '900+'
export type Accommodation = 'seated' | 'ramp' | 'flexibleSchedule' | 'adaptedKeyboard' | 'screenReader' | 'signLanguage'
export type EducationLevel = 'primary' | 'highSchool' | 'technical' | 'university'
export type Skill = 'customerService' | 'computing' | 'excel' | 'sales' | 'cooking' | 'crafts' | 'english'
export type ContactPreference = 'call' | 'whatsapp' | 'email'
export type PhysicalDemand = 'bothHands' | 'standing' | 'walkingDriving' | 'seeScreen' | 'phoneSpeaking' | 'hearing'
export type ApplicationStatus = 'sent' | 'inReview' | 'interview' | 'hired' | 'notSelected' | 'withdrawn'
export type InterviewMode = 'inPerson' | 'videoCall' | 'phoneCall'

/** "Lectura fácil" por secciones (la escribe el admin; null si no existe) */
export interface EasyRead {
  jobTitle: string
  whatYouDo: string[]
  whereAndWhen: string[]
  pay: string[]
  whatYouGet: string[]
  whatYouNeed: string[]
}

/** jobDto del back */
export interface Job {
  id: string
  title: string
  company: string
  city: string
  /** Código de provincia (catálogo) o null */
  province: string | null
  modality: Modality
  schedule: Schedule
  dailyHours: number | null
  salaryMin: number | null
  salaryMax: number | null
  /** Texto corto de la tarjeta */
  summary: string
  /** "Qué harás" */
  description: string
  /** "Qué necesitas" */
  requirements: string[]
  /** "Ajustes que ofrece la empresa" en detalle */
  accommodationsDetail: string[]
  /** "Salario y beneficios" */
  salaryBenefits: string
  easyRead: EasyRead | null
  compatibleDisabilities: DisabilityType[]
  physicalDemands: PhysicalDemand[]
  accommodationsOffered: Accommodation[]
  keywords: string[]
  minEducation: EducationLevel | null
  isActive: boolean
  /** ISO. "Publicada hace N días" */
  createdAt: string
}

/** Resultado del motor de match (reglas, no IA) */
export interface Match {
  jobId: string
  /** 0 a 100 */
  score: number
  recommended: boolean
  rejected: boolean
  rejectReason: string | null
  /** "Por qué encaja contigo" */
  reasons: string[]
  /** Lo que falta o conviene preguntar */
  warnings: string[]
  breakdown: { disability: number; accommodations: number; experience: number; education: number }
}

export type JobWithMatch = Job & { match: Match | null }

/** GET /api/jobs */
export interface JobListResponse {
  total: number
  page: number
  pageSize: number
  sort: 'compatibility' | 'recent'
  /** Cuántas ofertas habría al marcar cada filtro (sumado a lo ya elegido) */
  facets: {
    features: Record<JobFeature, number>
    salary: Record<SalaryRange, number>
    schedule: Record<Schedule, number>
  }
  items: JobWithMatch[]
}

/** GET /api/jobs/:id */
export interface JobDetailResponse {
  job: Job
  /** Solo con sesión */
  match: Match | null
  /** Si ya postuló (solo con sesión) */
  applicationId: string | null
}

/** GET /api/stats */
export interface Stats {
  activeJobs: number
  remoteJobs: number
  provinces: number
}

/** profileDto: GET /api/me, y `candidate` en /auth/verify y /signup */
export interface Profile {
  id: string
  idCard: {
    fullName: string
    idNumber: string
    birthDate: string | null
    disabilityType: DisabilityType
    disabilityPercent: number
    validity: string | 'indefinite' | null
  }
  contact: {
    fullName: string
    phone: string
    phoneVerifiedAt: string
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
    useProfile: true
    shareOnlyAccommodations: boolean
    discoverable: boolean
    consentAt: string
  }
  createdAt: string
}

/** Respuesta de /auth/verify (y `session` de /signup) */
export interface Session {
  token: string
  expiresAt: string
}

/** GET /api/catalog: listas { value, label } */
export interface Option<T extends string = string> {
  value: T
  label: string
}
export interface Catalog {
  disabilityTypes: Option<DisabilityType>[]
  contactPreferences: Option<ContactPreference>[]
  educationLevels: Option<EducationLevel>[]
  skills: Option<Skill>[]
  accommodations: Option<Accommodation>[]
  physicalDemands: (Option<PhysicalDemand> & { phrase: string })[]
  jobModalities: Option<Modality>[]
  jobSchedules: Option<Schedule>[]
  jobFeatures: Option<JobFeature>[]
  salaryRanges: (Option<SalaryRange> & { min: number; max: number | null })[]
  provinces: Option[]
  interviewModes: Option<InterviewMode>[]
  applicationStatuses: (Option<ApplicationStatus> & { stage: number })[]
}
