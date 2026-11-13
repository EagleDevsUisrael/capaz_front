import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { applyPrefsToDocument, useA11yPrefs } from '@/features/accessibility/useA11yPrefs'

/** Mantiene los atributos data-* de <html> sincronizados con las preferencias de accesibilidad. */
function A11yAttributes() {
  const vision = useA11yPrefs((s) => s.vision)
  const fontLarge = useA11yPrefs((s) => s.fontLarge)
  const easyRead = useA11yPrefs((s) => s.easyRead)

  useEffect(() => {
    applyPrefsToDocument({ vision, fontLarge, easyRead })
  }, [vision, fontLarge, easyRead])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <A11yAttributes />
      {children}
    </QueryClientProvider>
  )
}
