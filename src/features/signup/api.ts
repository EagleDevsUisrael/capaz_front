/** Llamadas del registro a capaz_backend (ver src/modules/{idCard,phone,cv,companyView,signup}.ts del back). */
import { api } from '@/shared/api/client'
import type { DisabilityType, Profile } from '@/shared/api/types'
import type { IdCardField } from './useSignupStore'

export interface ScanResult {
  scanId: string
  /** Compatibilidad con respuestas anteriores; ahora el backend devuelve error si no puede validar el documento. */
  ocrFailed?: boolean
  fullName: string | null
  idNumber: string | null
  birthDate: string | null
  disabilityType: DisabilityType | null
  disabilityPercent: number | null
  validity: string | null
  confidence: Partial<Record<IdCardField, number>>
  needsReview: IdCardField[]
  idNumberValid: boolean
  expiresAt: string
}

export function scanIdCard(front: Blob, back: Blob) {
  const fd = new FormData()
  fd.append('front', front, front instanceof File ? front.name : 'frente.jpg')
  fd.append('back', back, back instanceof File ? back.name : 'reverso.jpg')
  return api<ScanResult>('/id-card/scan', { method: 'POST', body: fd })
}

export interface CodeSent {
  verificationId: string
  channel: 'whatsapp' | 'sms'
  resendAfterSeconds: number
  expiresAt: string
  /** Solo en desarrollo (EXPOSE_DEV_LOGIN_CODE) */
  devCode?: string
}

export const sendPhoneCode = (phone: string, channel: 'whatsapp' | 'sms' = 'whatsapp') =>
  api<CodeSent>('/phone-verifications', { method: 'POST', body: { phone, channel } })

export const verifyPhoneCode = (verificationId: string, code: string) =>
  api<{ verified: true; phone: string; usableUntil: string }>(`/phone-verifications/${verificationId}/verify`, {
    method: 'POST',
    body: { code },
  })

export interface CvUpload {
  cvUploadId: string
  fileName: string
  sizeBytes: number
  expiresAt: string
}

export function uploadCv(file: File) {
  const fd = new FormData()
  fd.append('file', file, file.name)
  return api<CvUpload>('/cv-uploads', { method: 'POST', body: fd })
}

/** "Así te verá la empresa" (companyView del back) */
export interface CompanyView {
  fullName: string
  city: string
  educationLabel: string | null
  experienceSummary: string | null
  headline: string
  accommodationsNeeded: string[]
  otherAccommodation: string
  idCardHidden: true
  disabilityHidden: boolean
  disability: { type: DisabilityType; percent: number | null } | null
}

export const previewCompanyView = (body: unknown, signal?: AbortSignal) =>
  api<CompanyView>('/company-view/preview', { method: 'POST', body, signal })

export interface SignupResponse {
  token: string
  expiresAt: string
  candidate: Profile
  applicationId: string | null
}

export const submitSignup = (body: unknown) => api<SignupResponse>('/signup', { method: 'POST', body })

/** Cédula ecuatoriana: 10 dígitos, provincia 01–24 (o 30), tercer dígito < 6 y dígito verificador (módulo 10). */
export function isValidCedula(v: string) {
  if (!/^\d{10}$/.test(v)) return false
  const prov = Number(v.slice(0, 2))
  if (!((prov >= 1 && prov <= 24) || prov === 30) || Number(v[2]) >= 6) return false
  const sum = [...v.slice(0, 9)].reduce((acc, d, i) => {
    let n = Number(d) * (i % 2 === 0 ? 2 : 1)
    if (n > 9) n -= 9
    return acc + n
  }, 0)
  return (10 - (sum % 10)) % 10 === Number(v[9])
}
