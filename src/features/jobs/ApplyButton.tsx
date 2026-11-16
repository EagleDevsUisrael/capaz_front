import { useState } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { Link, useNavigate } from 'react-router'
import { ApiError, errorMessage } from '@/shared/api/client'
import { useSession } from '@/features/auth/useSession'
import { useSignupStore } from '@/features/signup/useSignupStore'
import { Button } from '@/shared/ui'
import { ArrowRightIcon } from '@/shared/ui/icons'
import { useApply } from './api'
import { jobSubtitle } from './labels'
import type { Job } from './types'

interface Props {
  job: Job
  label?: string
  fullWidth?: boolean
}

/**
 * "Postular". Sin sesión pregunta si ya tiene cuenta (flujo del documento: ¿Tiene cuenta?):
 * sí → Ingresar · no → registro de 4 pasos. En ambos casos recuerda a qué oferta quería postular.
 * Con sesión crea la postulación y va a "Postulación enviada".
 */
export function ApplyButton({ job, label = 'Postular a esta oferta', fullWidth }: Props) {
  const navigate = useNavigate()
  const signedIn = useSession((s) => s.signedIn)
  const setPendingJob = useSignupStore((s) => s.setPendingJob)
  const apply = useApply()
  const [askOpen, setAskOpen] = useState(false)

  const rememberJob = () => setPendingJob({ id: job.id, title: job.title, subtitle: jobSubtitle(job) })

  const onPress = () => {
    if (!signedIn) {
      setAskOpen(true)
      return
    }
    apply.mutate(job.id, { onSuccess: ({ id }) => navigate(`/applications/${id}/sent`) })
  }

  return (
    <>
      <Button variant="sun" fullWidth={fullWidth} onPress={onPress} isDisabled={apply.isPending}>
        {apply.isPending ? 'Enviando…' : label} {!apply.isPending && <ArrowRightIcon />}
      </Button>
      {apply.isError &&
        (apply.error instanceof ApiError && apply.error.status === 409 ? (
          <p className="apply__error" role="status">
            Ya postulaste a esta oferta. <Link to="/applications">Ver mis postulaciones</Link>
          </p>
        ) : (
          <p className="apply__error" role="alert">
            ⚠ {errorMessage(apply.error)}
          </p>
        ))}

      <ModalOverlay isOpen={askOpen} onOpenChange={setAskOpen} isDismissable className="dialog-overlay">
        <Modal className="dialog-modal dialog-modal--small">
          <Dialog className="dialog" aria-label="Para postular necesitas tu perfil">
            <Heading slot="title" className="dialog__title">
              Para postular necesitas tu perfil
            </Heading>
            <p className="dialog__lead">
              Lo registras una sola vez. Tarda unos 5 minutos y puedes hacerlo por voz. Después te mostramos los
              trabajos donde mejor encajas.
            </p>
            <div className="dialog__stack">
              <Button
                onPress={() => {
                  rememberJob()
                  navigate('/signup/id-card')
                }}
              >
                Crear mi perfil
              </Button>
              <Button
                variant="secondary"
                onPress={() => {
                  rememberJob()
                  navigate('/login')
                }}
              >
                Ya tengo cuenta
              </Button>
              <Button variant="ghost" onPress={() => setAskOpen(false)}>
                Ahora no
              </Button>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}
