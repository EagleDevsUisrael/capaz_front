import { Checkbox, CheckboxGroup, Label } from 'react-aria-components'
import { ChipGroup } from '@/shared/ui'
import { CheckIcon } from '@/shared/ui/icons'
import { FEATURE_LABEL, FEATURES, SALARY_OPTIONS, SCHEDULE_LABEL, SCHEDULES } from './labels'
import type { JobFeature, JobFilters, JobsResponse, SalaryRange, Schedule } from './types'

interface Props {
  filters: JobFilters
  facets?: JobsResponse['facets']
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
 * y dentro del panel "Filtrar ofertas" (celular). Las opciones de un mismo grupo se suman (o).
 */
export function FiltersPanel({ filters, facets, onChange, showHeader, onClear }: Props) {
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
        options={SALARY_OPTIONS}
        value={filters.salary}
        onChange={(salary) => onChange({ salary })}
      />
    </div>
  )
}
