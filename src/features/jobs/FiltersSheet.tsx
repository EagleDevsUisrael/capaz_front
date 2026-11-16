import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { Button } from '@/shared/ui'
import { FiltersPanel } from './FiltersPanel'
import type { JobFilters, JobsResponse } from './types'

interface Props {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  filters: JobFilters
  facets?: JobsResponse['facets']
  total?: number
  onChange: (patch: Partial<JobFilters>) => void
  onClear: () => void
}

/** Panel "Filtrar ofertas" a pantalla casi completa (celular). Los filtros se aplican al instante. */
export function FiltersSheet({ isOpen, onOpenChange, filters, facets, total, onChange, onClear }: Props) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onOpenChange} isDismissable className="dialog-overlay dialog-overlay--sheet">
      <Modal className="sheet">
        <Dialog className="sheet__dialog" aria-label="Filtrar ofertas">
          {({ close }) => (
            <>
              <div className="sheet__top">
                <Heading slot="title" className="sheet__title">
                  Filtrar ofertas
                </Heading>
                <Button variant="secondary" onPress={close}>
                  Cerrar
                </Button>
              </div>
              <div className="sheet__body">
                <FiltersPanel filters={filters} facets={facets} onChange={onChange} />
              </div>
              <div className="sheet__foot">
                <Button variant="secondary" onPress={onClear}>
                  Borrar
                </Button>
                <Button onPress={close}>{total === undefined ? 'Ver ofertas' : `Ver ${total} ${total === 1 ? 'oferta' : 'ofertas'}`}</Button>
              </div>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
