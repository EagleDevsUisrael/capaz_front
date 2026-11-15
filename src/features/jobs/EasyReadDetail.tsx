import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/shared/ui'
import {
  BanknoteIcon,
  BookIcon,
  CalendarIcon,
  CheckIcon,
  ChatIcon,
  ClockIcon,
  GraduationIcon,
  HomeIcon,
  MonitorIcon,
  PhoneIcon,
  VolumeIcon,
} from '@/shared/ui/icons'
import { useTextToSpeech } from '@/shared/voice/useTextToSpeech'
import { ApplyButton } from './ApplyButton'
import type { Job, PictoName } from './types'

const PICTOS: Record<PictoName, typeof CheckIcon> = {
  phone: PhoneIcon,
  help: ChatIcon,
  home: HomeIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  money: BanknoteIcon,
  computer: MonitorIcon,
  school: GraduationIcon,
  check: CheckIcon,
}

/**
 * Detalle en Lectura fácil: frases cortas, una idea por línea, un pictograma por idea, sin porcentajes
 * ni palabras técnicas. El texto sale de `job.easyReadSummary`, escrito a mano (no generado al vuelo).
 */
export function EasyReadDetail({ job }: { job: Job & { easyReadSummary: NonNullable<Job['easyReadSummary']> } }) {
  const { speak, stop, isSupported } = useTextToSpeech()
  const [speaking, setSpeaking] = useState(false)
  const er = job.easyReadSummary

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
    const text = [er.title, er.company, ...er.sections.flatMap((s) => [s.heading, ...s.lines.map((l) => l.text)])].join('. ')
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

      <h1 className="easy__title">{er.title}</h1>
      <p className="easy__company">{er.company}</p>

      {isSupported && (
        <Button variant="secondary" fullWidth onPress={readAll} aria-pressed={speaking}>
          <VolumeIcon /> {speaking ? 'Detener' : 'Escuchar esta página'}
        </Button>
      )}

      {er.sections.map((s) => (
        <section key={s.heading} className="easy__section">
          <h2 className="easy__h">{s.heading}</h2>
          <ul className="easy__lines">
            {s.lines.map((l) => {
              const Picto = PICTOS[l.icon]
              return (
                <li key={l.text}>
                  <span className="easy__picto" aria-hidden="true">
                    <Picto size={28} />
                  </span>
                  <span>{l.text}</span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      <div className="easy__apply">
        <ApplyButton job={job} label="Quiero este trabajo" fullWidth />
      </div>
    </article>
  )
}
