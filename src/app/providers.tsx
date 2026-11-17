import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { applyPrefsToDocument, useA11yPrefs } from '@/features/accessibility/useA11yPrefs'

/** Mantiene los atributos data-* de <html> sincronizados con las preferencias de accesibilidad. */
function A11yAttributes() {
  const vision = useA11yPrefs((s) => s.vision)
  const fontLarge = useA11yPrefs((s) => s.fontLarge)
  const easyRead = useA11yPrefs((s) => s.easyRead)
  const readScreen = useA11yPrefs((s) => s.readScreen)

  useEffect(() => {
    applyPrefsToDocument({ vision, fontLarge, easyRead, readScreen })
  }, [vision, fontLarge, easyRead, readScreen])

  return null
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Demo local: evitar tráfico periódico o reconsultas al cambiar de ventana.
            staleTime: Infinity,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <A11yAttributes />
      {children}
    </QueryClientProvider>
  )
}
