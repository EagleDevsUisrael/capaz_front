import { useEffect, useRef, type ReactNode } from 'react'
import { TOTAL_STEPS } from './steps'
import { useSignupStore } from './useSignupStore'

interface Props {
  step: number
  title: string
  lead?: string
  children: ReactNode
}

/**
 * Cabecera común de cada paso: "Paso N de 4" + barra de progreso + título (<h1>) + texto de apoyo.
 * El <h1> lleva "Paso N de 4." solo para lectores de pantalla: al cambiar de paso el foco va al título
 * y se anuncia en qué paso está la persona.
 * Si el envío final (paso 4) devolvió un error de este paso, se muestra arriba como alerta.
 */
export function StepFrame({ step, title, lead, children }: Props) {
  const stepError = useSignupStore((s) => (s.stepError?.step === step ? s.stepError : null))
  const alertRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (stepError) alertRef.current?.focus()
  }, [stepError])

  return (
    <div className="step">
      <p className="step__count" aria-hidden="true">
        Paso {step} de {TOTAL_STEPS}
      </p>
      <div
        className="step__bar"
        role="progressbar"
        aria-label="Progreso del registro"
        aria-valuemin={0}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={step}
        aria-valuetext={`Paso ${step} de ${TOTAL_STEPS}`}
      >
        <span style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>
      <h1 className="step__title">
        <span className="sr-only">
          Paso {step} de {TOTAL_STEPS}.{' '}
        </span>
        {title}
      </h1>
      {lead && <p className="step__lead">{lead}</p>}
      {stepError && (
        <div ref={alertRef} tabIndex={-1} role="alert" className="step__alert">
          <strong>Corrige este paso para terminar tu registro.</strong> {stepError.message}
          {stepError.fields && (
            <ul>
              {Object.entries(stepError.fields).map(([k, m]) => (
                <li key={k}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
