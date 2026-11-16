/**
 * Normalización del dictado por tipo de campo (documento: "Normalización por tipo de campo").
 * Funciones puras, sin dependencias: se pueden probar fuera del navegador.
 */

export type FieldKind = 'name' | 'email' | 'phone' | 'idNumber' | 'number' | 'date' | 'validity' | 'city' | 'longText' | 'query'

const DIGITS: Record<string, string> = {
  cero: '0',
  uno: '1',
  una: '1',
  dos: '2',
  tres: '3',
  cuatro: '4',
  cinco: '5',
  seis: '6',
  siete: '7',
  ocho: '8',
  nueve: '9',
}

/** "cero nueve nueve ocho" / "0 9 9 8" / "099 876 5432" → "0998". Palabras desconocidas se ignoran. */
export function spokenToDigits(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => DIGITS[w] ?? w)
    .join('')
    .replace(/\D/g, '')
}

function spokenToDate(text: string): string {
  const digits = spokenToDigits(text)
  return digits.length === 8 ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}` : text.trim()
}

/** "mafer punto torres arroba gmail punto com" → "mafer.torres@gmail.com" */
export function spokenToEmail(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s*arroba\s*/g, '@')
    .replace(/\s*punto\s*/g, '.')
    .replace(/\s*gui[oó]n\s+bajo\s*/g, '_')
    .replace(/\s*gui[oó]n\s*/g, '-')
    .replace(/\s+/g, '')
}

// Partículas que en un nombre se quedan en minúscula ("María de los Ángeles")
const LOWER_WORDS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e'])

/**
 * Pone mayúscula inicial a cada palabra.
 * OJO: no se usa \b: en JavaScript \b no reconoce las letras con tilde como parte de una palabra,
 * y "maría" saldría como "MarÍa". Se detecta el inicio de palabra con (^|espacio|guion).
 */
export function toTitleCase(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_m, sep: string, c: string) => sep + c.toUpperCase())
    .split(' ')
    .map((w, i) => (i > 0 && LOWER_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w))
    .join(' ')
}

/** Cómo se escribe lo dictado, según el tipo de campo. */
export const normalizers: Record<FieldKind, (text: string) => string> = {
  email: spokenToEmail,
  phone: spokenToDigits,
  idNumber: spokenToDigits,
  number: spokenToDigits,
  date: spokenToDate,
  validity: (text) => (/indefinida/i.test(text) ? 'Indefinida' : spokenToDate(text)),
  name: toTitleCase,
  city: toTitleCase,
  // Experiencia o ajustes: se agrega al texto existente (lo hace VoiceField), aquí solo se limpia
  longText: (t) => t.trim(),
  // Búsqueda de empleo: se escribe tal cual, sin punto final
  query: (t) => t.trim().replace(/[.,;]+$/, ''),
}
