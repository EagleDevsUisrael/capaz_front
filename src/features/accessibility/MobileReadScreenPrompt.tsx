import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { useLocation } from 'react-router'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Button } from '@/shared/ui'
import { VolumeIcon } from '@/shared/ui/icons'
import { useA11yPrefs } from './useA11yPrefs'
import './accessibility.css'

/** Pregunta inicial, una sola vez por dispositivo y únicamente en pantallas móviles. */
export function MobileReadScreenPrompt() {
  const mobile = useMediaQuery('(max-width: 899px)')
  const { pathname } = useLocation()
  const seen = useA11yPrefs((s) => s.readerPromptSeen)
  const setSeen = useA11yPrefs((s) => s.setReaderPromptSeen)
  const setReadScreen = useA11yPrefs((s) => s.setReadScreen)

  const choose = (enabled: boolean) => {
    setReadScreen(enabled)
    setSeen(true)
  }

  return (
    <ModalOverlay isOpen={mobile && !seen && pathname === '/'} isDismissable={false} className="dialog-overlay">
      <Modal className="dialog-modal dialog-modal--reader">
        <Dialog className="dialog reader-prompt" aria-label="Configurar lectura de pantalla">
          <VolumeIcon size={44} />
          <Heading slot="title" className="dialog__title">¿Quieres escuchar la pantalla?</Heading>
          <p className="dialog__lead">Podemos leer los títulos y botones con una voz. La pantalla también será más sencilla.</p>
          <div className="reader-prompt__actions">
            <Button fullWidth onPress={() => choose(true)}>Activar Leer pantalla</Button>
            <Button fullWidth variant="secondary" onPress={() => choose(false)}>Desactivar Leer pantalla</Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
