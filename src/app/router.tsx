import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'
import { AccessibilityPage } from '@/features/accessibility/AccessibilityPage'
import { ColorVisionPage } from '@/features/accessibility/ColorVisionPage'
import { AdminJobsPage } from '@/features/admin/AdminJobsPage'
import { ApplicationSent } from '@/features/applications/ApplicationSent'
import { ApplicationsPage } from '@/features/applications/ApplicationsPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { JobDetailPage } from '@/features/jobs/JobDetailPage'
import { JobsPage } from '@/features/jobs/JobsPage'
import { ForYouPage } from '@/features/matches/ForYouPage'
import { ContactStep } from '@/features/signup/ContactStep'
import { ExperienceStep } from '@/features/signup/ExperienceStep'
import { IdCardCamera } from '@/features/signup/IdCardCamera'
import { IdCardStep } from '@/features/signup/IdCardStep'
import { PrivacyStep } from '@/features/signup/PrivacyStep'
import { SignupLayout } from '@/features/signup/SignupLayout'
import { AppLayout } from './AppLayout'
import { RequireSessionRoute } from './RequireSession'
import { PlainShell, PublicShell } from './shells'

// Rutas del documento ("Inventario de pantallas"), en inglés.
// PublicShell = con barra de accesibilidad y cabecera · PlainShell = pantalla completa · SignupLayout = registro
const publicRoutes: RouteObject[] = [
  { index: true, element: <JobsPage /> },
  { path: 'jobs/:jobId', element: <JobDetailPage /> },
  // Requieren sesión: sin sesión van a /login?next=...
  {
    element: <RequireSessionRoute />,
    children: [
      { path: 'for-you', element: <ForYouPage /> },
      { path: 'applications', element: <ApplicationsPage /> },
    ],
  },
]

const plainRoutes: RouteObject[] = [
  { path: 'login', element: <LoginPage /> },
  { element: <RequireSessionRoute />, children: [{ path: 'applications/:applicationId/sent', element: <ApplicationSent /> }] },
  { path: 'accessibility', element: <AccessibilityPage /> },
  { path: 'accessibility/colors', element: <ColorVisionPage /> },
  { path: 'admin/jobs', element: <AdminJobsPage /> },
  { path: 'signup/id-card/camera', element: <IdCardCamera /> },
  // Solo en desarrollo: muestrario de componentes y temas (no se incluye en producción)
  ...(import.meta.env.DEV
    ? [
        {
          path: 'dev/ui',
          lazy: async () => ({ Component: (await import('@/shared/ui/UiShowcase')).UiShowcase }),
        } satisfies RouteObject,
      ]
    : []),
]

// Registro en 4 pasos (se hace una sola vez). Los pasos van dentro de SignupLayout (barra lateral + progreso).
const signupRoutes: RouteObject[] = [
  { path: 'signup', element: <Navigate to="/signup/id-card" replace /> },
  { path: 'signup/id-card', element: <IdCardStep /> },
  { path: 'signup/contact', element: <ContactStep /> },
  { path: 'signup/experience', element: <ExperienceStep /> },
  { path: 'signup/privacy', element: <PrivacyStep /> },
]

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { element: <PublicShell />, children: publicRoutes },
      { element: <PlainShell />, children: plainRoutes },
      { element: <SignupLayout />, children: signupRoutes },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
