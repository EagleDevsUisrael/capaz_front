import { useState, type ReactNode } from 'react'
import { Button as AriaButton } from 'react-aria-components'
import { BookIcon, CheckIcon, ContrastIcon, EyeIcon, TextSizeIcon, VolumeIcon } from '@/shared/ui/icons'
import { ColorVisionDialog } from './ColorVisionDialog'
import { useA11yPrefs } from './useA11yPrefs'
import './accessibility.css'

interface BarButtonProps {
  icon: ReactNode
  label: string
  active: boolean
  onPress: () => void
  /** Botones que abren un panel en vez de encender/apagar algo */
  opensDialog?: boolean
}

function BarButton({ icon, label, active, onPress, opensDialog }: BarButtonProps) {
  return (
    <AriaButton
      className={`a11y-bar__btn${active ? ' is-active' : ''}`}
      onPress={onPress}
      // Los interruptores anuncian "pulsado"; el de colores abre un diálogo
      {...(opensDialog ? { 'aria-haspopup': 'dialog' as const } : { 'aria-pressed': active })}
    >
      {icon}
      <span>{label}</span>
      {/* El estado nunca depende solo del color: icono ✓ y texto para lectores de pantalla */}
      {active && <CheckIcon size={16} />}
      {active && opensDialog && <span className="sr-only">(activado)</span>}
    </AriaButton>
  )
}

/**
 * Barra de accesibilidad (escritorio): Leer pantalla, Letra grande, Colores para daltonismo,
 * Alto contraste y Lectura fácil. Alto contraste y daltonismo se excluyen entre sí (un solo campo `vision`).
 * En celular no se muestra: ahí hay un enlace "Opciones" que lleva a /accessibility.
 */
export function AccessibilityBar() {
  const { readScreen, setReadScreen, fontLarge, setFontLarge, vision, setVision, easyRead, setEasyRead } =
    useA11yPrefs()
  const [colorsOpen, setColorsOpen] = useState(false)
  const daltonism = vision === 'redGreen' || vision === 'blueYellow' || vision === 'mono'

  return (
    <section className="a11y-bar" aria-label="Opciones de accesibilidad">
      <div className="a11y-bar__inner">
        <span className="a11y-bar__title" aria-hidden="true">
          Opciones de accesibilidad:
        </span>
        <div className="a11y-bar__buttons">
          <BarButton icon={<VolumeIcon size={20} />} label="Leer pantalla" active={readScreen} onPress={() => setReadScreen(!readScreen)} />
          <BarButton icon={<TextSizeIcon size={20} />} label="Letra grande" active={fontLarge} onPress={() => setFontLarge(!fontLarge)} />
          <BarButton icon={<EyeIcon size={20} />} label="Colores para daltonismo" active={daltonism} opensDialog onPress={() => setColorsOpen(true)} />
          <BarButton icon={<ContrastIcon size={20} />} label="Alto contraste" active={vision === 'highContrast'} onPress={() => setVision(vision === 'highContrast' ? 'normal' : 'highContrast')} />
          <BarButton icon={<BookIcon size={20} />} label="Lectura fácil" active={easyRead} onPress={() => setEasyRead(!easyRead)} />
        </div>
        <a className="a11y-bar__skip" href="#main">
          Saltar al contenido principal
        </a>
      </div>
      <ColorVisionDialog isOpen={colorsOpen} onOpenChange={setColorsOpen} />
    </section>
  )
}
