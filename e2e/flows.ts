import { expect, type Page } from '@playwright/test'
import { photo, uniqueCedula, uniquePhone } from './helpers'

export interface Candidate {
  cedula: string
  phone: string
  name: string
}

type OnStep = (step: string) => Promise<void>

/** Registro completo por la interfaz (4 pasos). Llama a onStep en cada pantalla para revisarla. */
export async function registerCandidate(page: Page, onStep: OnStep = async () => {}): Promise<Candidate> {
  const c: Candidate = { cedula: uniqueCedula(), phone: uniquePhone(), name: 'Prueba E2E Automatica' }

  // Paso 1: carnet
  await page.goto('/signup/id-card')
  await expect(page.getByRole('heading', { level: 1, name: 'Tu documento' })).toBeVisible()
  await onStep('registro-1-carnet')
  await page.locator('#idcard-front').setInputFiles(photo('frente.png'))
  await page.locator('#idcard-back').setInputFiles(photo('reverso.png'))
  await page.getByRole('button', { name: 'Leer mis datos' }).click()
  await expect(page.getByRole('heading', { name: 'Revisa los datos que leímos' })).toBeVisible({ timeout: 30_000 })
  await onStep('registro-1-datos-leidos')

  // La IA llenó la grilla (o el formulario si pidió revisar): el nombre no está vacío
  const nameField = page.getByRole('textbox', { name: 'Nombre', exact: true })
  if (!(await nameField.isVisible())) {
    const nameValue = page.locator('.idcard-grid__item').filter({ hasText: 'Nombre' }).locator('dd')
    await expect(nameValue).not.toHaveText(/^\s*—?\s*$/)
    await page.getByRole('button', { name: 'Corregir datos' }).click()
  }
  await expect(nameField).not.toHaveValue('')
  await page.getByRole('textbox', { name: 'Cédula' }).fill(c.cedula)
  await page.getByRole('button', { name: /Confirmar y continuar/ }).click()

  // Paso 2: contacto
  await expect(page).toHaveURL(/\/signup\/contact$/)
  await expect(page.getByRole('heading', { level: 1, name: '¿Cómo te contactamos?' })).toBeVisible()
  await onStep('registro-2-contacto')
  await page.getByRole('textbox', { name: 'Nombre completo' }).fill(c.name)
  await page.getByRole('textbox', { name: 'Celular' }).fill(c.phone)
  await page.getByRole('textbox', { name: 'Correo electrónico' }).fill(`prueba.e2e.${c.cedula}@example.com`)
  await page.getByRole('textbox', { name: 'Ciudad donde vives' }).fill('Quito')
  await page.getByRole('button', { name: /Continuar al paso 3/ }).click()
  const hint = page.getByText(/Demostración: ingresa este código \d{4}/)
  await expect(hint).toBeVisible()
  await onStep('registro-2-codigo')
  const code = (await hint.textContent())!.match(/(\d{4})/)![1]
  await page.getByRole('textbox', { name: 'Código de 4 dígitos' }).fill(code)
  await page.getByRole('button', { name: 'Confirmar código' }).click()

  // Paso 3: experiencia
  await expect(page).toHaveURL(/\/signup\/experience$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Tu experiencia' })).toBeVisible()
  await onStep('registro-3-experiencia')
  await page.getByRole('radio', { name: /Sí, he trabajado/ }).click()
  await page.getByRole('textbox', { name: 'Cuéntanos qué hiciste' }).fill('Trabajé dos años en atención al cliente.')
  await page.getByRole('radiogroup', { name: '¿Hasta dónde estudiaste?' }).getByRole('radio').first().click()
  await page.getByLabel(/Qué sabes hacer/).getByRole('button').first().click()
  await page.getByLabel(/Qué ajustes necesitas/).getByRole('button').first().click()
  await onStep('registro-3-experiencia-llena')
  await page.getByRole('button', { name: /Continuar al paso 4/ }).click()

  // Paso 4: privacidad
  await expect(page).toHaveURL(/\/signup\/privacy$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Tú decides qué se comparte' })).toBeVisible()
  const preview = page.locator('.privacy-preview')
  await expect(preview.getByText('Carnet y diagnóstico ocultos')).toBeVisible()
  await expect(preview).not.toContainText(c.cedula)
  await expect(preview).not.toContainText(/Discapacidad:/)
  await onStep('registro-4-privacidad')
  await page.getByRole('button', { name: 'Ver mis trabajos' }).click()
  await expect(page).toHaveURL(/\/for-you$/, { timeout: 30_000 })
  return c
}
