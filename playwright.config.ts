import { defineConfig, devices } from '@playwright/test'

/**
 * Pruebas e2e + accesibilidad (axe). Los servicios ya están corriendo:
 * front https://localhost:5173 (certificado propio), back :3000 e IA :4000.
 */
const fakeCamera = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  // Una prueba a la vez: todas salen de la misma IP y el back limita los pedidos de código por IP
  // (protección real contra abuso). En paralelo, los registros simultáneos disparan ese límite.
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'https://localhost:5173',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    locale: 'es-EC',
  },
  projects: [
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], launchOptions: { args: fakeCamera } },
    },
    {
      name: 'celular',
      use: { ...devices['Pixel 7'], browserName: 'chromium', launchOptions: { args: fakeCamera } },
    },
  ],
})
