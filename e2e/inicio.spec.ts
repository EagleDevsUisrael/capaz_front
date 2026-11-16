import { expect, test } from '@playwright/test'
import { expectNoA11yViolations, firstJobId } from './helpers'

test.describe('Inicio', () => {
  test('carga ofertas reales, busca y filtra por accesibilidad', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: /Encuentra un trabajo/ })).toBeVisible()
    const cards = page.locator('article.job-card')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThan(0)
    await expect(page.getByRole('list', { name: 'Capaz en cifras' })).toBeVisible()
    await expectNoA11yViolations(page, 'inicio')

    const status = page.locator('.jobs-body__count')
    await expect(status).toHaveText(/Mostrando \d+/)
    const before = await status.textContent()

    // Filtro de accesibilidad (escritorio: barra lateral · celular: panel "Filtros")
    if (await page.locator('.jobs-body__filters').isVisible()) {
      await page.locator('.jobs-body__filters label.filter-check').first().click()
      await expect(page.locator('.jobs-body__filters').getByRole('checkbox').first()).toBeChecked()
    } else {
      await page.getByRole('button', { name: /^Filtros/ }).click()
      const dialog = page.getByRole('dialog')
      await dialog.locator('label.filter-check').first().click()
      await expect(dialog.getByRole('checkbox').first()).toBeChecked()
      await expectNoA11yViolations(page, 'inicio-filtros-celular')
      await page.keyboard.press('Escape')
    }
    await expect(status).toHaveText(/ con /)
    expect(await status.textContent()).not.toBe(before)

    // Búsqueda por texto
    const search = page.getByRole('searchbox').or(page.getByRole('textbox', { name: /busca|qué/i })).first()
    await search.fill('a')
    await search.press('Enter')
    await expect(page).toHaveURL(/q=a/)
    await expect(status).toHaveText(/Mostrando \d+/)
  })

  test('detalle de una oferta y Lectura fácil', async ({ page }) => {
    const id = await firstJobId(page)
    await page.goto(`/jobs/${id}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /Postular/ })).toBeVisible()
    await expectNoA11yViolations(page, 'detalle')

    // Lectura fácil (se guarda en el dispositivo; en celular no hay barra, se activa en /accessibility)
    const bar = page.getByRole('region', { name: 'Opciones de accesibilidad' })
    if (await bar.isVisible()) {
      await bar.getByRole('button', { name: /Lectura fácil/ }).click()
    } else {
      await page.goto('/accessibility')
      await page.locator('label').filter({ has: page.getByRole('switch', { name: /Lectura fácil/ }) }).click()
      await expect(page.getByRole('switch', { name: /Lectura fácil/ })).toBeChecked()
      await page.goto(`/jobs/${id}`)
    }
    await expect(page.locator('html')).toHaveAttribute('data-reading', 'easy')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoA11yViolations(page, 'lectura-facil')
  })

  test('letra grande y alto contraste siguen siendo accesibles', async ({ page }) => {
    const id = await firstJobId(page)
    await page.goto('/')
    const bar = page.getByRole('region', { name: 'Opciones de accesibilidad' })
    if (await bar.isVisible()) {
      await bar.getByRole('button', { name: 'Letra grande' }).click()
      await bar.getByRole('button', { name: 'Alto contraste' }).click()
      await expect(bar.getByRole('button', { name: 'Letra grande' })).toHaveAttribute('aria-pressed', 'true')
    } else {
      await page.evaluate(() =>
        localStorage.setItem('capaz-a11y', JSON.stringify({ state: { fontLarge: true, vision: 'highContrast' }, version: 0 })),
      )
      await page.reload()
    }
    await expect(page.locator('html')).toHaveAttribute('data-font', 'large')
    await expect(page.locator('html')).toHaveAttribute('data-vision', 'highContrast')
    await expect(page.locator('article.job-card').first()).toBeVisible()
    await expectNoA11yViolations(page, 'inicio-contraste')
    await page.goto(`/jobs/${id}`)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectNoA11yViolations(page, 'detalle-contraste')
  })
})
