'use client'

import { useMemo, useState } from 'react'
import type { Analysis } from '@/lib/huffman'
import { encodeToBits, packBits } from '@/lib/huffman'
import { num, hexDump, prettyChar } from '@/lib/format'

const CAP_CHARS = 2048
const CAP_BYTES = 8192

interface RowItem {
  t: 'seg' | 'bd'
  sym?: string
  bits?: string
}
interface Row {
  offset: number
  items: RowItem[]
}

function buildRows(
  text: string,
  analysis: Analysis
): { rows: Row[]; omittedChars: number; totalBits: number } {
  const codeMap = analysis.codes
  const capped = text.length > CAP_CHARS
  const slice = capped ? text.slice(0, CAP_CHARS) : text

  let offset = 0
  let rowOffset = 0
  const rows: Row[] = []
  let items: RowItem[] = []
  const flush = () => {
    if (items.length) {
      rows.push({ offset: rowOffset, items })
      rowOffset += 32
      items = []
    }
  }

  for (const ch of slice) {
    const code = codeMap.get(ch) ?? ''
    let rest = code
    while (rest) {
      const nextByte = Math.ceil((offset + 1) / 8) * 8
      const take = Math.min(rest.length, nextByte - offset)
      items.push({ t: 'seg', sym: ch, bits: rest.slice(0, take) })
      offset += take
      rest = rest.slice(take)
      if (offset % 32 === 0) {
        flush()
      } else if (offset % 8 === 0) {
        items.push({ t: 'bd' })
      }
    }
  }
  if (items.length) flush()

  return { rows, omittedChars: capped ? text.length - CAP_CHARS : 0, totalBits: offset }
}

export default function BitsPane({
  text,
  analysis,
  hovered,
  pinned,
  onHover,
  onPin,
}: {
  text: string
  analysis: Analysis
  hovered: string | null
  pinned: string | null
  onHover: (s: string | null) => void
  onPin: (s: string | null) => void
}) {
  const [tab, setTab] = useState<'bits' | 'bytes'>('bits')
  const [showAll, setShowAll] = useState(false)

  const rowsState = useMemo(() => buildRows(text, analysis), [text, analysis])

  const packed = useMemo(() => {
    const all = text.length > CAP_CHARS * 3 ? text.slice(0, CAP_CHARS * 3) : text
    return packBits(encodeToBits(all, analysis.codes))
  }, [text, analysis])

  const capBytes = showAll ? packed.bytes.length : Math.min(CAP_BYTES, packed.bytes.length)
  const byteRows = useMemo(() => hexDump(packed.bytes.slice(0, capBytes)), [packed, capBytes])
  const bytesOmitted = packed.bytes.length - capBytes

  return (
    <div className="terminal">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-darkline px-4 py-3">
        <div className="flex items-center gap-2">
          {(
            [
              ['bits', 'bits'],
              ['bytes', 'hexdump'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`font-mono text-[10.5px] uppercase tracking-[0.1em] px-3 py-1.5 border ${
                tab === k ? 'border-phos text-phos' : 'border-darkline text-phosdim'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px] text-phosdim">
          hover a row below → FIG. 03 · click to pin · thin tick = byte boundary
        </p>
      </div>

      {tab === 'bits' ? (
        <div className="overflow-auto overscroll-contain p-4" style={{ maxHeight: 'min(70vh, 720px)' }}>
          {rowsState.rows.length === 0 ? (
            <p className="font-mono text-[12px] text-phosdim">
              single-symbol alphabet — payload is 0 bits; the lone codeword ε carries the story.
            </p>
          ) : (
            <>
              <table className="w-full font-mono text-[13px] leading-[1.6]">
                <tbody>
                  {rowsState.rows.map((row, ri) => (
                    <tr key={ri} className="align-top">
                      <td className="select-none pr-4 text-right text-[10.5px] text-phosdim/60 tabular-nums">
                        {String(row.offset).padStart(5, ' ')}
                      </td>
                      <td className="whitespace-pre">
                        {row.items.map((it, ii) =>
                          it.t === 'bd' ? (
                            <span key={ii} className="mx-[5px] inline-block h-3 w-px bg-darkline align-middle" />
                          ) : (
                            <span
                              key={ii}
                              data-sym={it.sym}
                              onMouseEnter={() => onHover(it.sym!)}
                              onMouseLeave={() => onHover(null)}
                              onClick={() => onPin(pinned === it.sym ? null : it.sym!)}
                              title={`${prettyChar(it.sym!)} → ${analysis.codes.get(it.sym!)}`}
                              className={`bitspan cursor-pointer rounded-[1px] transition-colors ${
                                hovered === it.sym || pinned === it.sym
                                  ? 'bg-phos/15 text-phos font-medium'
                                  : ''
                              }`}
                            >
                              {it.bits}
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 border-t border-darkline pt-3 font-mono text-[11px] text-phosdim">
                {num(rowsState.totalBits)} payload bits · {num(rowsState.rows.length)} rows of 32
                {rowsState.omittedChars > 0 && (
                  <>
                    {' '}
                    · <span className="text-phos">{num(rowsState.omittedChars)} symbols omitted — feed the tree a smaller sample to trace them all</span>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-auto overscroll-contain p-4" style={{ maxHeight: 'min(70vh, 720px)' }}>
          <table className="w-full font-mono text-[12.5px] leading-[1.7]">
            <tbody>
              {byteRows.map((rowBytes, i) => (
                <tr key={i} className="align-top">
                  <td className="select-none pr-4 text-right text-[10.5px] text-phosdim/60 tabular-nums">
                    {(i * 8).toString(16).toUpperCase().padStart(4, '0')}
                  </td>
                  {rowBytes.map((b, j) => (
                    <td key={j} className="px-1 text-phos/90 tabular-nums">
                      {b}
                    </td>
                  ))}
                  <td className="pl-5 text-phosdim">
                    {rowBytes
                      .map((hex) => {
                        const v = parseInt(hex, 16)
                        return v >= 0x20 && v <= 0x7e ? String.fromCharCode(v) : '·'
                      })
                      .join('')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bytesOmitted > 0 && (
            <button
              type="button"
              className="btn btn-sm mt-3 border-phos text-phos"
              onClick={() => setShowAll(true)}
            >
              + dump all {num(packed.bytes.length)} payload bytes
            </button>
          )}
          <p className="mt-4 border-t border-darkline pt-3 font-mono text-[11px] text-phosdim">
            {num(capBytes)} of {num(packed.bytes.length)} packed bytes displayed · trailing padding{' '}
            {packed.pad} bit{packed.pad === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  )
}