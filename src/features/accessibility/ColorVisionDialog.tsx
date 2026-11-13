import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { Button } from '@/shared/ui'
import { ColorVisionPicker } from './ColorVisionPicker'
import './accessibility.css'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

/** Panel "¿Cómo ves mejor los colores?" (escritorio). React Aria da el foco atrapado, Esc y ARIA del diálogo. */
export function ColorVisionDialog({ isOpen, onOpenChange }: Props) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className="dialog-overlay">
      <Modal className="dialog-modal">
        <Dialog className="dialog" aria-label="Colores para daltonismo">
          {({ close }) => (
            <>
              <Heading slot="title" className="dialog__title">
                ¿Cómo ves mejor los colores?
              </Heading>
              <p className="dialog__lead">Elige la opción en la que distingas mejor los botones.</p>
              <ColorVisionPicker />
              <div className="dialog__actions">
                <Button onPress={close}>Cerrar</Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
