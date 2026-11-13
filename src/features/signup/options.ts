import type { ChipOption } from '@/shared/ui'

/** Códigos en inglés (los usa el motor de match); etiquetas en español (lo que ve la persona). */
export const CONTACT_PREFERENCES = [
  { value: 'call', label: 'Llamada' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Correo' },
] as const satisfies ChipOption<string>[]
export type ContactPreference = (typeof CONTACT_PREFERENCES)[number]['value']

export const EDUCATION_LEVELS = [
  { value: 'primary', label: 'Primaria' },
  { value: 'highSchool', label: 'Bachillerato' },
  { value: 'technical', label: 'Técnico o tecnológico' },
  { value: 'university', label: 'Universidad' },
] as const satisfies ChipOption<string>[]
export type EducationLevel = (typeof EDUCATION_LEVELS)[number]['value']

export const SKILLS = [
  { value: 'customerService', label: 'Atención al cliente' },
  { value: 'computing', label: 'Computación' },
  { value: 'excel', label: 'Excel' },
  { value: 'sales', label: 'Ventas' },
  { value: 'cooking', label: 'Cocina' },
  { value: 'crafts', label: 'Manualidades' },
  { value: 'english', label: 'Inglés' },
] as const satisfies ChipOption<string>[]
export type Skill = (typeof SKILLS)[number]['value']

// TODO(equipo/backend): acordar esta lista con el motor de match (accommodationsNeeded / accommodationsOffered)
export const ACCOMMODATIONS = [
  { value: 'seated', label: 'Trabajo sentado' },
  { value: 'ramp', label: 'Rampa o ascensor' },
  { value: 'flexibleSchedule', label: 'Horario flexible' },
  { value: 'adaptedKeyboard', label: 'Teclado adaptado' },
  { value: 'screenReader', label: 'Lector de pantalla' },
  { value: 'signLanguage', label: 'Intérprete de señas' },
] as const satisfies ChipOption<string>[]
export type Accommodation = (typeof ACCOMMODATIONS)[number]['value']

export const labelOf = (list: readonly ChipOption<string>[], value: string | null) =>
  list.find((o) => o.value === value)?.label ?? ''
