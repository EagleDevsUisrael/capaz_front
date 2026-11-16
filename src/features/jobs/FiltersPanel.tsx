import { Checkbox, CheckboxGroup, Label } from 'react-aria-components'
import { ChipGroup } from '@/shared/ui'
import { CheckIcon } from '@/shared/ui/icons'
import { FEATURE_LABEL, FEATURES, SALARY_OPTIONS, SCHEDULE_LABEL, SCHEDULES } from './labels'
import type { JobFeature, JobFilters, JobListResponse, SalaryRange, Schedule } from './types'

export type Facets = JobListResponse['facets']

interface Props {
  filters: JobFilters
  /** Cuántas ofertas habría al marcar cada opción (lo calcula el back) */
  facets?: Facets
  onChange: (patch: Partial<JobFilters>) => void
  /** Escritorio: título "Filtrar ofertas" + "Borrar todo" arriba */
  showHeader?: boolean
  onClear?: () => void
}

function CheckRow({ value, label, count }: { value: string; label: string; count?: number }) {
  return (
    <Checkbox value={value} className="filter-check">
      <span className="filter-check__box" aria-hidden="true">
        <CheckIcon size={16} />
      </span>
      <span className="filter-check__label">{label}</span>
      {count !== undefined && <span className="filter-check__count">{count}</span>}
    </Checkbox>
  )
}

/**
 * Filtros: accesibilidad del puesto, tipo de jornada y salario. Se usa en la barra lateral (escritorio)
 * y dentro del panel "Filtrar ofertas" (celular). Accesibilidad: el back exige todas las marcadas (y); jornada: cualquiera (o).
 */
export function FiltersPanel({ filters, facets, onChange, showHeader, onClear }: Props) {
  const salaryOptions = SALARY_OPTIONS.map((o) =>
    facets ? { ...o, label: `${o.label} (${facets.salary[o.value] ?? 0})` } : o,
  )

  return (
    <div className="filters">
      {showHeader && (
        <div className="filters__head">
          <h2 className="filters__title">Filtrar ofertas</h2>
          <button type="button" className="filters__clear" onClick={onClear}>
            Borrar todo
          </button>
        </div>
      )}

      <CheckboxGroup
        className="filters__group"
        value={filters.features}
        onChange={(v) => onChange({ features: v as JobFeature[] })}
      >
        <Label className="filters__label">Accesibilidad del puesto</Label>
        {FEATURES.map((a) => (
          <CheckRow key={a} value={a} label={FEATURE_LABEL[a]} count={facets?.features[a]} />
        ))}
      </CheckboxGroup>

      <CheckboxGroup
        className="filters__group"
        value={filters.schedule}
        onChange={(v) => onChange({ schedule: v as Schedule[] })}
      >
        <Label className="filters__label">Tipo de jornada</Label>
        {SCHEDULES.map((w) => (
          <CheckRow key={w} value={w} label={SCHEDULE_LABEL[w]} count={facets?.schedule[w]} />
        ))}
      </CheckboxGroup>

      <ChipGroup<SalaryRange>
        label="Salario mensual"
        selectionMode="single"
        variant="large"
        options={salaryOptions}
        value={filters.salary}
        onChange={(salary) => onChange({ salary })}
      />
    </div>
  )
}
