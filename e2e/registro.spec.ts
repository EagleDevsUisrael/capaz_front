import { expect, test } from '@playwright/test'
import { registerCandidate } from './flows'
import { dismissMobileReadScreenPrompt, expectNoA11yViolations } from './helpers'

test('registro completo, recomendaciones, postulación y nuevo ingreso', async ({ page }) => {
  test.setTimeout(180_000)
  const c = await registerCandidate(page, (step) => expectNoA11yViolations(page, step))

  // Para ti: recomendaciones con % y bloque de la IA
  await expect(page.getByRole('heading', { level: 1, name: 'Trabajos para ti' })).toBeVisible()
  await expect(page.locator('.foryou__score').first()).toContainText('%', { timeout: 30_000 })
  await expect(page.getByRole('heading', { name: 'Lo que te recomienda la IA' })).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('.foryou__ai-summary')).toBeVisible({ timeout: 60_000 })
  await expectNoA11yViolations(page, 'para-ti')

  // Abrir una oferta y postular
  const firstCard = page.locator('.foryou__card').first()
  const title = (await firstCard.locator('h3').textContent())!.trim()
  await firstCard.getByRole('link', { name: 'Ver oferta' }).click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await expectNoA11yViolations(page, 'detalle-con-sesion')
  await page.getByRole('button', { name: /Postular/ }).click()
  await expect(page.getByText('Postulación enviada').first()).toBeVisible()
  await expectNoA11yViolations(page, 'postulacion-enviada')

  await page.goto('/applications')
  await expect(page.getByRole('heading', { level: 1, name: 'Mis postulaciones' })).toBeVisible()
  await expect(page.locator('.apps-card').filter({ hasText: title })).toBeVisible()
  await expectNoA11yViolations(page, 'mis-postulaciones')

  // Cerrar sesión e ingresar de nuevo con la cédula
  await page.goto('/')
  await dismissMobileReadScreenPrompt(page)
  const account = page.getByRole('button', { name: /Tu cuenta/ })
  if (await account.isVisible()) {
    await account.click()
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  } else {
    await page.locator('.app-header__menu').first().click()
    await page.getByRole('button', { name: /Tu cuenta/ }).click()
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  }
  await expect(page.getByRole('link', { name: 'Ingresar' }).first()).toBeVisible()

  await page.goto('/login')
  await expectNoA11yViolations(page, 'ingresar')
  await page.getByLabel('Número de cédula').fill(c.cedula)
  await page.getByRole('button', { name: 'Enviarme el código' }).click()
  await expect(page.getByText(/Demostración: ingresa este código/)).toBeVisible()
  await expectNoA11yViolations(page, 'ingresar-codigo')
  const code = (await page.locator('.login__dev strong').textContent())!.trim()
  await page.getByLabel('Código de 4 números').fill(code)
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click()
  await expect(page).toHaveURL(/\/for-you$/)
  await expect(page.getByRole('button', { name: /Tu cuenta/ })).toBeVisible()
})
