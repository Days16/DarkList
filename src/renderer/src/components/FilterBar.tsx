import { useEffect, useRef } from 'react'
import { useUiStore } from '../store/uiStore'
import { FilterType, SortType } from '@shared/types'

export default function FilterBar(): JSX.Element {
  const { filter, setFilter, sort, setSort, searchQuery, setSearchQuery, focusSearchTrigger, t } = useUiStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all', label: t('all') },
    { id: 'today', label: t('today') },
    { id: 'week', label: t('week') },
    { id: 'priority', label: t('priority_high') }
  ]

  const SORTS: { id: SortType; label: string }[] = [
    { id: 'created', label: t('history') },
    { id: 'due_date', label: t('due_date') },
    { id: 'priority', label: t('priority') }
  ]

  useEffect(() => {
    if (focusSearchTrigger > 0) inputRef.current?.focus()
  }, [focusSearchTrigger])

  return (
    <div className="px-4 py-3 flex flex-col gap-2 border-b border-border-color">
      {/* Search */}
      <input
        ref={inputRef}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('search_placeholder')}
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
