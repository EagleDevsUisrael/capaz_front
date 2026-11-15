import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui'
import { SearchIcon } from '@/shared/ui/icons'
import { VoiceField } from '@/shared/voice/VoiceField'

interface Props {
  q: string
  city: string
  onSearch: (v: { q: string; city: string }) => void
}

/** Buscador del inicio: "¿Qué trabajo buscas?" y "¿En qué ciudad?", los dos con micrófono. */
export function SearchBar({ q, city, onSearch }: Props) {
  const [draftQ, setDraftQ] = useState(q)
  const [draftCity, setDraftCity] = useState(city)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSearch({ q: draftQ, city: draftCity })
  }

  return (
    <form className="search" role="search" aria-label="Buscar empleo" onSubmit={submit}>
      <VoiceField
        kind="query"
        label="¿Qué trabajo buscas?"
        placeholder="Ej.: atención al cliente, digitador"
        value={draftQ}
        onChange={setDraftQ}
      />
      <VoiceField
        kind="city"
        label="¿En qué ciudad?"
        placeholder="Ej.: Guayaquil o teletrabajo"
        value={draftCity}
        onChange={setDraftCity}
      />
      <Button type="submit" className="search__submit">
        <SearchIcon size={20} /> Buscar empleo
      </Button>
    </form>
  )
}
