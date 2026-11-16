import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

let counter = 0
const rand = (n: number) => Math.floor(Math.random() * n)

/** Cédula ecuatoriana válida y (casi seguro) única: provincia 01-24, tercer dígito < 6, verificador módulo 10. */
export function uniqueCedula(): string {
  const province = String(1 + rand(24)).padStart(2, '0')
  const third = String(rand(6))
  // 6 dígitos "únicos": tiempo + contador + azar
  const tail = String((Date.now() + counter++ * 7919 + rand(1000)) % 1_000_000).padStart(6, '0')
  const nine = province + third + tail
  const sum = nine
    .split('')
    .map((d, i) => {
      const v = Number(d) * (i % 2 === 0 ? 2 : 1)
      return v > 9 ? v - 9 : v
    })
    .reduce((a, b) => a + b, 0)
  const check = (10 - (sum % 10)) % 10
  return nine + String(check)
}

/** Celular ecuatoriano 09XXXXXXXX único */
export function uniquePhone(): string {
  return '09' + String((Date.now() + counter++ * 104729 + rand(1000)) % 100_000_000).padStart(8, '0')
}

/** PNG de 1x1 para subir como foto del carnet (el OCR de demostración acepta cualquier imagen) */
export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

export const photo = (name: string) => ({ name, mimeType: 'image/png', buffer: tinyPng })

/** Revisión axe WCAG 2.2 AA: falla con violaciones serias o críticas y adjunta el resultado completo. */
export async function expectNoA11yViolations(page: Page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  await test.info().attach(`axe-${name}.json`, {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  })
  const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const summary = bad.map(
    (v) => `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).slice(0, 8).join('\n  ')}`,
  )
  expect(summary, `Violaciones de accesibilidad en "${name}"`).toEqual([])
}

/** Primera oferta publicada (para abrir el detalle directamente) */
export async function firstJobId(page: Page): Promise<string> {
  const r = await page.request.get('/api/jobs')
  expect(r.ok(), `GET /api/jobs -> ${r.status()} ${await r.text()}`).toBeTruthy()
  const body = (await r.json()) as { items: { id: string; easyRead?: unknown }[] }
  expect(body.items.length).toBeGreaterThan(0)
  return (body.items.find((j) => j.easyRead) ?? body.items[0]).id
}
