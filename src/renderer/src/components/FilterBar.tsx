import { useUiStore } from '../store/uiStore'
import { FilterType, SortType } from '@shared/types'

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Esta semana' },
  { id: 'priority', label: 'Alta prioridad' }
]

const SORTS: { id: SortType; label: string }[] = [
  { id: 'created', label: 'Fecha creación' },
  { id: 'due_date', label: 'Fecha límite' },
  { id: 'priority', label: 'Prioridad' }
]

export default function FilterBar(): JSX.Element {
  const { filter, sort, searchQuery, setFilter, setSort, setSearchQuery } = useUiStore()

  return (
    <div className="px-4 py-3 flex flex-col gap-2 border-b border-[#1e1e20]">
      {/* Search */}
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar tarea…"
        className="w-full bg-elevated text-text-primary rounded-input px-3 py-1.5 text-sm
          outline-none border border-transparent focus:border-accent transition-colors"
      />

      {/* Filter tabs */}
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-input text-xs transition-colors duration-fast
              ${filter === f.id ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="bg-elevated text-text-secondary text-xs rounded-input px-2 py-1 outline-none
              border border-transparent focus:border-accent cursor-pointer"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
