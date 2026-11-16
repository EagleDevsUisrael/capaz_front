import { expect, test, type Page } from '@playwright/test'
import { registerCandidate } from './flows'
import { dismissMobileReadScreenPrompt, uniqueCedula } from './helpers'

/** El elemento con foco tiene un indicador visible (outline o box-shadow) */
async function focusIndicator(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return { tag: 'body', visible: false }
    const s = getComputedStyle(el)
    const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0
    const shadow = s.boxShadow !== 'none' && s.boxShadow !== ''
    return { tag: `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 40)}"`, visible: outline || shadow }
  })
}

test.describe('Solo teclado', () => {
  test.skip(({ isMobile }) => isMobile, 'Teclado físico: se prueba en escritorio')

  test('el enlace "Saltar al contenido" lleva el foco al main', async ({ page }) => {
    await page.goto('/')
    await dismissMobileReadScreenPrompt(page)
    await expect(page.locator('article.job-card').first()).toBeVisible()
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Saltar al contenido principal' }).first()
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page.locator('main#main')).toBeFocused()
  })

  test('Tab por la barra de accesibilidad y la cabecera con foco visible', async ({ page }) => {
    await page.goto('/')
    await dismissMobileReadScreenPrompt(page)
    await expect(page.locator('article.job-card').first()).toBeVisible()
    const offenders: string[] = []
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab')
      const f = await focusIndicator(page)
      if (!f.visible) offenders.push(f.tag)
    }
    expect(offenders, 'Elementos sin foco visible').toEqual([])
  })

  test('paso 1 de ingreso solo con teclado', async ({ page }) => {
    await page.goto('/login')
    // Con foco en el título, Tab va al primer campo (tras el enlace de salto/logo)
    const input = page.getByLabel('Número de cédula')
    for (let i = 0; i < 6 && !(await input.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab')
    }
    await expect(input).toBeFocused()
    await page.keyboard.type(uniqueCedula())
    await page.keyboard.press('Tab')
    // Radios del canal: flecha para elegir SMS
    await page.keyboard.press('ArrowDown')
    await expect(page.getByRole('radio', { name: /SMS/ })).toBeChecked()
    await page.keyboard.press('Enter')
    // Cédula no registrada: el back responde con error o (modo demo) pide el código; ambos casos son válidos
    await expect(
      page.getByRole('heading', { name: 'Escribe tu código' }).or(page.locator('#login-error').filter({ hasText: /\S/ })),
    ).toBeVisible()
  })

  test('menú de la cuenta se abre con teclado y se cierra con Escape', async ({ page }) => {
    test.setTimeout(150_000)
    await registerCandidate(page)
    await page.goto('/')
    await dismissMobileReadScreenPrompt(page)
    const btn = page.getByRole('button', { name: /Tu cuenta/ })
    await btn.focus()
    await page.keyboard.press('Enter')
    await expect(btn).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#user-menu')).toBeVisible()
    await page.keyboard.press('Tab')
    await expect(page.locator('#user-menu a').first()).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(page.locator('#user-menu')).toBeHidden()
    await expect(btn).toHaveAttribute('aria-expanded', 'false')
    await expect(btn).toBeFocused()
  })
})
