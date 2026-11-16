import { Checkbox, CheckboxGroup, Label } from 'react-aria-components'
import { ChipGroup } from '@/shared/ui'
import { CheckIcon } from '@/shared/ui/icons'
import { ACCESSIBILITY_FILTERS } from './filterJobs'
import { ACCESS_FILTER_LABEL, SALARY_OPTIONS, WORKDAY_LABEL, WORKDAYS } from './labels'
import type { AccessibilityFilter, JobFilters, SalaryRange, Workday } from './types'

interface Props {
  filters: JobFilters
  counts?: Record<AccessibilityFilter, number>
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
export function FiltersPanel({ filters, counts, onChange, showHeader, onClear }: Props) {
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
        value={filters.accessibility}
        onChange={(v) => onChange({ accessibility: v as AccessibilityFilter[] })}
      >
        <Label className="filters__label">Accesibilidad del puesto</Label>
        {ACCESSIBILITY_FILTERS.map((a) => (
          <CheckRow key={a} value={a} label={ACCESS_FILTER_LABEL[a]} count={counts?.[a]} />
        ))}
      </CheckboxGroup>

      <CheckboxGroup
        className="filters__group"
        value={filters.workday}
        onChange={(v) => onChange({ workday: v as Workday[] })}
      >
        <Label className="filters__label">Tipo de jornada</Label>
        {WORKDAYS.map((w) => (
          <CheckRow key={w} value={w} label={WORKDAY_LABEL[w]} />
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
