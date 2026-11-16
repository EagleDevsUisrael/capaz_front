import { AudioIcon, BarChartIcon, BriefcaseIcon, HeadsetIcon, HomeIcon, MonitorIcon, ShieldCheckIcon } from '@/shared/ui/icons'
import type { JobIconName } from './types'

const ICONS: Record<JobIconName, typeof BriefcaseIcon> = {
  headset: HeadsetIcon,
  chart: BarChartIcon,
  audio: AudioIcon,
  shield: ShieldCheckIcon,
  briefcase: BriefcaseIcon,
  monitor: MonitorIcon,
  home: HomeIcon,
}

/** Cuadrado de color suave con el icono del tipo de trabajo (decorativo). */
export function JobIcon({ name, size = 28 }: { name: JobIconName; size?: number }) {
  const Cmp = ICONS[name]
  return (
    <span className="job-icon" aria-hidden="true">
      <Cmp size={size} />
    </span>
  )
}
