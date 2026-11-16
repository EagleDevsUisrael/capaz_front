import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/shared/ui'
import {
  BanknoteIcon,
  BookIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  GraduationIcon,
  VolumeIcon,
} from '@/shared/ui/icons'
import { useTextToSpeech } from '@/shared/voice/useTextToSpeech'
import { ApplyButton } from './ApplyButton'
import type { EasyRead, Job } from './types'

/**
 * El backend manda la lectura fácil en 5 listas fijas (EasyRead). Los títulos de sección y el pictograma
 * de cada una los pone el front: así el admin solo escribe frases cortas.
 */
const SECTIONS: { key: Exclude<keyof EasyRead, 'jobTitle'>; heading: string; Picto: typeof CheckIcon }[] = [
  { key: 'whatYouDo', heading: 'Qué harás', Picto: BriefcaseIcon },
  { key: 'whereAndWhen', heading: 'Dónde y cuándo', Picto: CalendarIcon },
  { key: 'pay', heading: 'Cuánto pagan', Picto: BanknoteIcon },
  { key: 'whatYouGet', heading: 'Qué te damos', Picto: CheckIcon },
  { key: 'whatYouNeed', heading: 'Qué necesitas', Picto: GraduationIcon },
]

/** Detalle en Lectura fácil: una idea por línea, un pictograma por sección, letra de 20 px. */
export function EasyReadDetail({ job, easyRead: er }: { job: Job; easyRead: EasyRead }) {
  const { speak, isSupported } = useTextToSpeech()
  const [speaking, setSpeaking] = useState(false)

  // Si la persona sale de la pantalla, la voz se corta
  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    },
    [],
  )

  const sections = SECTIONS.filter((s) => er[s.key].length > 0)

  const readAll = () => {
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    const text = [er.jobTitle, job.company, ...sections.flatMap((s) => [s.heading, ...er[s.key]])].join('. ')
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

      <h1 className="easy__title">{er.jobTitle}</h1>
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
        <ApplyButton job={job} label="Quiero este trabajo" fullWidth />
      </div>
    </article>
  )
}
