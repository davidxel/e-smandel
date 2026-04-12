import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

type PaginatedTableProps = {
  /** Teks placeholder kotak cari */
  searchPlaceholder?: string
  /** Filter baris berdasarkan string (case-insensitive) pada kolom yang dipilih */
  searchFilter?: (row: unknown, q: string) => boolean
  pageSize?: number
  children: (ctx: {
    pageRows: unknown[]
    total: number
    query: string
    setQuery: (q: string) => void
  }) => ReactNode
  /** Seluruh baris sebelum filter */
  rows: unknown[]
}

export function PaginatedTable({
  searchPlaceholder = 'Cari…',
  searchFilter,
  pageSize = 10,
  rows,
  children,
}: PaginatedTableProps) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !searchFilter) return rows
    return rows.filter((r) => searchFilter(r, q))
  }, [rows, query, searchFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)))
  }, [totalPages])

  const safePage = Math.min(page, totalPages - 1)
  const pageRows = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  )

  return (
    <div className="space-y-3">
      {searchFilter ? (
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20"
          />
        </div>
      ) : null}

      {children({
        pageRows,
        total: filtered.length,
        query,
        setQuery,
      })}

      {filtered.length > pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <span>
            Menampilkan {safePage * pageSize + 1}–
            {Math.min((safePage + 1) * pageSize, filtered.length)} dari{' '}
            {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="tabular-nums">
              {safePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
