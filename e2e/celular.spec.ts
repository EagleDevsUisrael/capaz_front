import { expect, test, type Page } from '@playwright/test'
import { registerCandidate } from './flows'
import { dismissMobileReadScreenPrompt, firstJobId, photo } from './helpers'

async function expectNoHorizontalOverflow(page: Page, name: string) {
  const { scroll, width } = await page.evaluate(() => ({
    scroll: document.scrollingElement!.scrollWidth,
    width: window.innerWidth,
  }))
  expect(scroll, `Desborde horizontal en "${name}"`).toBeLessThanOrEqual(width)
}

/** Botones y enlaces del contenido principal de menos de 44x44 px (WCAG 2.5.5 / recomendación del proyecto) */
async function smallTargets(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main a[href], main button, main [role="button"], main label[for]')]
      // Etiquetas de campos de texto no cuentan (el objetivo es el campo); las de input[type=file] sí son el botón
      .filter((el) => !(el instanceof HTMLLabelElement) || el.control?.getAttribute('type') === 'file')
      .filter((el) => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) return false
        // Enlaces dentro de un párrafo (texto corrido) están exceptuados por WCAG 2.5.8
        if (el.tagName === 'A' && el.closest('p, li') && getComputedStyle(el).display === 'inline') return false
        return r.width < 44 || r.height < 44
      })
      .map((el) => {
        const r = el.getBoundingClientRect()
        return `${el.tagName.toLowerCase()} "${(el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`
      }),
  )
}

test.describe('Celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'Solo en el proyecto "celular"')

  test('sin desborde horizontal, barra inferior y objetivos táctiles', async ({ page }) => {
    test.setTimeout(180_000)
    const id = await firstJobId(page)
    await page.goto('/')
    await dismissMobileReadScreenPrompt(page)
    await expect(page.locator('article.job-card').first()).toBeVisible()
    await expectNoHorizontalOverflow(page, 'inicio')
    await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible()
    const offenders: Record<string, string[]> = {}
    offenders.inicio = await smallTargets(page)

    await page.goto(`/jobs/${id}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoHorizontalOverflow(page, 'detalle')
    offenders.detalle = await smallTargets(page)

    await registerCandidate(page, async (step) => {
      await expectNoHorizontalOverflow(page, step)
      offenders[step] = await smallTargets(page)
    })

    await expect(page.locator('.foryou__card').first()).toBeVisible({ timeout: 30_000 })
    await expectNoHorizontalOverflow(page, 'para-ti')
    offenders['para-ti'] = await smallTargets(page)

    await page.goto('/applications')
    await expect(page.getByRole('heading', { level: 1, name: 'Mis postulaciones' })).toBeVisible()
    await expectNoHorizontalOverflow(page, 'postulaciones')
    await expect(page.getByRole('navigation', { name: 'Secciones' })).toBeVisible()
    offenders.postulaciones = await smallTargets(page)

    const tab = await page.getByRole('navigation', { name: 'Secciones' }).getByRole('link').first().boundingBox()
    expect(tab!.height).toBeGreaterThanOrEqual(44)

    const report = Object.entries(offenders).filter(([, v]) => v.length)
    await test.info().attach('objetivos-pequenos.json', { body: JSON.stringify(Object.fromEntries(report), null, 2), contentType: 'application/json' })
    expect(report, 'Objetivos táctiles de menos de 44x44 px').toEqual([])
  })

  test('pregunta si debe activar Leer pantalla al entrar por primera vez', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('dialog', { name: 'Configurar lectura de pantalla' })).toBeVisible()
    await page.getByRole('button', { name: 'Activar Leer pantalla', exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('data-reader', 'active')
    await expect(page.locator('html')).not.toHaveAttribute('data-reading', 'easy')
    await expect(page.locator('html')).not.toHaveAttribute('data-vision', 'highContrast')
    await expect(page.getByRole('heading', { level: 1, name: 'Busca un trabajo para ti' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('dialog', { name: 'Configurar lectura de pantalla' })).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('data-reader', 'active')
    await expect(page.locator('html')).not.toHaveAttribute('data-reading', 'easy')
    await expect(page.locator('html')).not.toHaveAttribute('data-vision', 'highContrast')

    await page.goto('/accessibility')
    await page.locator('label').filter({ has: page.getByRole('switch', { name: 'Alto contraste' }) }).click()
    await expect(page.locator('html')).toHaveAttribute('data-reader', 'active')
    await expect(page.locator('html')).toHaveAttribute('data-vision', 'highContrast')
  })

  test('cámara del carnet con cámara simulada', async ({ page }) => {
    await page.goto('/signup/id-card/camera?side=front')
    await expect(page.getByRole('heading', { level: 1, name: /Foto del frente/i })).toBeVisible()
    await expect(page.getByRole('status')).toHaveText(/Encuadra|Listo/)
    await expectNoHorizontalOverflow(page, 'camara')
    await page.getByRole('button', { name: 'Tomar foto' }).click()
    await expect(page.getByRole('img', { name: /Foto tomada/ })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Usar esta foto' })).toBeVisible()
  })

  test('explica qué hacer cuando la cédula no muestra datos de discapacidad', async ({ page }) => {
    await page.route('**/api/id-card/scan', (route) =>
      route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'DISABILITY_DATA_NOT_FOUND',
            message: 'No encontramos información de discapacidad en el documento.',
          },
        }),
      }),
    )
    await page.goto('/signup/id-card')
    await page.locator('#idcard-front').setInputFiles(photo('frente.png'))
    await page.locator('#idcard-back').setInputFiles(photo('reverso.png'))
    await page.getByRole('button', { name: 'Leer mis datos' }).click()

    await expect(page.getByRole('heading', { name: 'No encontramos datos de discapacidad' })).toBeVisible()
    await expect(page.getByText(/sin borrones, cortes ni reflejos/i)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Subir fotos nuevas' })).toBeVisible()
    await expect(page.getByRole('link', { name: /actualizar mi cédula en el MSP/i })).toHaveAttribute('href', /salud\.gob\.ec/)
  })
})
