'use client'

import { useMemo, useState } from 'react'
import type { CodeEntry } from '@/lib/huffman'
import { num, pct } from '@/lib/format'
import { SymBadge } from '@/components/ui'

type SortKey = 'freq' | 'sym' | 'length' | 'code'

const HEAD = 64

export default function CodeTable({
  entries,
  hovered,
  pinned,
  onHover,
  onPin,
}: {
  entries: CodeEntry[]
  hovered: string | null
  pinned: string | null
  onHover: (s: string | null) => void
  onPin: (s: string | null) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>('freq')
  const [asc, setAsc] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const sorted = useMemo(() => {
    const list = [...entries]
    list.sort((a, b) => {
      let d = 0
      if (sortKey === 'freq') d = a.freq - b.freq
      else if (sortKey === 'sym') d = a.sym < b.sym ? -1 : a.sym > b.sym ? 1 : 0
      else if (sortKey === 'length') d = a.length - b.length || b.freq - a.freq
      else d = a.code.length - b.code.length || a.freq - b.freq
      return asc ? d : -d
    })
    return list
  }, [entries, sortKey, asc])

  const shown = expanded ? sorted : sorted.slice(0, HEAD)
  const totalBits = entries.reduce((s, e) => s + e.freq * e.length, 0)

  const copyAll = async () => {
    const lines = sorted.map((e) => `${JSON.stringify(e.sym)}\t${e.code}\t${e.length}\t${e.freq}`)
    await navigator.clipboard.writeText(lines.join('\n'))
  }

  const th = (k: SortKey, label: string, right = false) => (
    <th
      className={right ? 'num-r' : ''}
      onClick={() => {
        if (sortKey === k) setAsc(!asc)
        else {
          setSortKey(k)
          setAsc(false)
        }
      }}
    >
      <button
        type="button"
        className={`cursor-pointer uppercase tracking-[0.14em] ${sortKey === k ? 'text-rust' : ''}`}
      >
        {label}
        {sortKey === k ? (asc ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  )

  return (
    <div className="terminal overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-darkline px-4 py-3">
        <p className="text-[12.5px] text-phosdim">
          <strong>{num(entries.length)}</strong> codewords · <strong>{num(totalBits)}</strong> bits
          spent in total · hover a row to trace it through the bitstream below
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-phosdim">
            sort
          </span>
          {(
            [
              ['freq', 'freq'],
              ['length', 'ℓ'],
              ['sym', 'sym'],
            ] as [SortKey, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (sortKey === k) setAsc(!asc)
                else {
                  setSortKey(k)
                  setAsc(false)
                }
              }}
              className={`text-[12.5px] px-2.5 py-1 border rounded ${
                sortKey === k ? 'border-ink text-ink font-medium bg-dark' : 'border-darkline text-phosdim'
              }`}
            >
              {label}
            </button>
          ))}
          <button type="button" onClick={copyAll} className="btn btn-sm">
            copy all
          </button>
        </div>
      </div>

      <div className="max-h-[min(70vh,720px)] overflow-auto overscroll-contain">
        <table className="tbl w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-dark">
            <tr>
              <th>#</th>
              <th>Symbol</th>
              {th('freq', 'Freq ↓', true)}
              <th className="num-r">Prob.</th>
              <th>Share</th>
              <th>Codeword</th>
              {th('length', 'ℓ')}
              <th className="num-r">Bits spent</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((e) => {
              const rank = sorted.indexOf(e) + 1
              const hot = hovered === e.sym || pinned === e.sym
              return (
                <tr
                  key={e.sym}
                  data-sym={e.sym}
                  onMouseEnter={() => onHover(e.sym)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onPin(pinned === e.sym ? null : e.sym)}
                  className={`cursor-pointer ${hot ? 'text-phos' : 'text-phosdim'}`}
                >
                  <td className="text-[11px]">{rank}</td>
                  <td>
                    <SymBadge sym={e.sym} size="sm" />
                  </td>
                  <td className="num-r font-medium">{num(e.freq)}</td>
                  <td className="num-r">{pct(e.prob, 2)}</td>
                  <td>
                    <div className="bar-track" style={{ height: 5, background: '#35301f' }}>
                      <div
                        className={hot ? 'bar-fill bar-fill-green' : 'bar-fill'}
                        style={{ width: `${(e.prob / (entries[0] ? e.prob / entries[0].prob : 1)) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td>
                    <span
                      className={`codeword ${hot ? 'text-phos font-medium' : ''} ${
                        e.length === 0 ? 'text-phosdim/50' : ''
                      }`}
                    >
                      {e.code === '' ? 'ε' : e.code}
                    </span>
                  </td>
                  <td className="num-r">{e.length === 0 ? '0' : e.length}</td>
                  <td className={`num-r ${hot ? 'text-phos' : ''}`}>{num(e.freq * e.length)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sorted.length > HEAD && (
        <div className="border-t border-darkline px-4 py-3">
          <button type="button" className="btn btn-sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'collapse table' : `+ show all remaining ${num(sorted.length - HEAD)} codes`}
          </button>
        </div>
      )}

      <p className="border-t border-darkline px-4 py-2.5 text-[12px] text-phosdim/80">
        ε = the single-symbol degenerate code (empty), shown only for an alphabet of one · click a row to pin its trace · 0→left 1→right
      </p>
    </div>
  )
}