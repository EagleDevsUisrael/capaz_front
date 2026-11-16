import { AudioIcon, BarChartIcon, BriefcaseIcon, HeadsetIcon, HomeIcon, MonitorIcon, ShieldCheckIcon } from '@/shared/ui/icons'
import { iconFor } from './labels'
import type { Job, JobIcon as JobIconName } from './types'

const ICONS: Record<JobIconName, typeof BriefcaseIcon> = {
  headset: HeadsetIcon,
  chart: BarChartIcon,
  audio: AudioIcon,
  shield: ShieldCheckIcon,
  briefcase: BriefcaseIcon,
  monitor: MonitorIcon,
  home: HomeIcon,
}

/** Cuadrado de color suave con el icono del tipo de trabajo (decorativo, deducido del título). */
export function JobIcon({ job, size = 28 }: { job: Pick<Job, 'title' | 'keywords'>; size?: number }) {
  const Cmp = ICONS[iconFor(job)]
  return (
    <span className="job-icon" aria-hidden="true">
      <Cmp size={size} />
    </span>
  )
}
