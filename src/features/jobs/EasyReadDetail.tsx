import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/shared/ui'
import {
  BanknoteIcon,
  BookIcon,
  CalendarIcon,
  CheckIcon,
  ChatIcon,
  GraduationIcon,
  MonitorIcon,
  VolumeIcon,
} from '@/shared/ui/icons'
import { useTextToSpeech } from '@/shared/voice/useTextToSpeech'
import { ApplyButton } from './ApplyButton'
import type { EasyRead, Job } from './types'

type SectionKey = Exclude<keyof EasyRead, 'jobTitle'>

/** Orden, título y pictograma de cada sección de Lectura fácil */
const SECTIONS: { key: SectionKey; heading: string; Picto: typeof CheckIcon }[] = [
  { key: 'whatYouDo', heading: 'Qué harás', Picto: MonitorIcon },
  { key: 'whereAndWhen', heading: 'Dónde y cuándo', Picto: CalendarIcon },
  { key: 'pay', heading: 'Cuánto ganas', Picto: BanknoteIcon },
  { key: 'whatYouGet', heading: 'Qué te dan', Picto: ChatIcon },
  { key: 'whatYouNeed', heading: 'Qué necesitas', Picto: GraduationIcon },
]

interface Props {
  job: Job
  easyRead: EasyRead
  applicationId?: string | null
}

/**
 * Detalle en Lectura fácil: frases cortas, una idea por línea, un pictograma por sección, sin porcentajes
 * ni palabras técnicas. El texto sale de `job.easyRead`, escrito a mano por el admin (no generado al vuelo).
 */
export function EasyReadDetail({ job, easyRead: er, applicationId }: Props) {
  const { speak, stop, isSupported } = useTextToSpeech()
  const [speaking, setSpeaking] = useState(false)
  const sections = SECTIONS.filter((s) => er[s.key].length > 0)
  const title = er.jobTitle || job.title

  // Si la persona sale de la pantalla, la voz se corta
  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    },
    [],
  )

  const readAll = () => {
    if (speaking) {
      stop()
      setSpeaking(false)
      return
    }
    const text = [title, job.company, ...sections.flatMap((s) => [s.heading, ...er[s.key]])].join('. ')
    setSpeaking(true)
    speak(text, () => setSpeaking(false))
  }

  return (
    <article className="easy">
      <div className="easy__top">
        <Link to="/" className="easy__back">
          Volver
        </Link>
        <span className="easy__badge">
          <BookIcon size={18} /> Lectura fácil
        </span>
      </div>

      <h1 className="easy__title">{title}</h1>
      <p className="easy__company">{job.company}</p>

      {isSupported && (
        <Button variant="secondary" fullWidth onPress={readAll} aria-pressed={speaking}>
          <VolumeIcon /> {speaking ? 'Detener' : 'Escuchar esta página'}
        </Button>
      )}

      {sections.map(({ key, heading, Picto }) => (
        <section key={key} className="easy__section">
          <h2 className="easy__h">{heading}</h2>
          <ul className="easy__lines">
            {er[key].map((line) => (
              <li key={line}>
                <span className="easy__picto" aria-hidden="true">
                  <Picto size={28} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="easy__apply">
        {applicationId ? (
          <Link to="/applications" className="ui-button ui-button--secondary">
            Ya postulaste. Ver mis postulaciones
          </Link>
        ) : (
          <ApplyButton job={job} label="Quiero este trabajo" fullWidth />
        )}
      </div>
    </article>
  )
}
