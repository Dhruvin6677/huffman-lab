import type { ReactNode } from 'react'

export function PageHead({
  kicker,
  title,
  lede,
  meta,
}: {
  idx: string
  kicker: string
  title: ReactNode
  lede?: ReactNode
  meta?: { k: string; v: ReactNode }[]
}) {
  return (
    <section className="wrap pt-14 pb-8">
      <p className="kicker">{kicker}</p>
      <h1 className="display mt-2">{title}</h1>
      {lede && (
        <p className="mt-5 max-w-[62ch] text-[1.05rem] leading-relaxed text-ink2">{lede}</p>
      )}
      {meta && (
        <dl className="mt-8 grid gap-px border border-hair bg-hair sm:grid-cols-2 lg:grid-cols-4 rounded-lg overflow-hidden">
          {meta.map((m) => (
            <div key={m.k} className="bg-surface px-5 py-4">
              <dt className="microlabel">{m.k}</dt>
              <dd className="mt-1 text-[15px] font-semibold text-ink">{m.v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

export function Fig({
  num,
  title,
  children,
  className = '',
}: {
  num: string
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`${className}`}>
      <div className="figlabel mb-4">
        <span className="fignum">{num}</span>
        <span className="figtitle">{title}</span>
      </div>
      {children}
    </section>
  )
}

export function Stat({
  label,
  value,
  suffix,
  accent,
  bar,
}: {
  label: string
  value: ReactNode
  suffix?: ReactNode
  accent?: boolean
  bar?: number
}) {
  return (
    <div className="stat border border-hair bg-surface rounded-lg px-5 py-4">
      <p className="microlabel">{label}</p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className={`num ${accent ? 'text-rust' : ''}`}>{value}</span>
        {suffix && <span className="suffix">{suffix}</span>}
      </p>
      {typeof bar === 'number' && (
        <div className="bar-track mt-3" role="img" aria-label={`${label}: ${(bar * 100).toFixed(0)}%`}>
          <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(100, bar * 100))}%` }} />
        </div>
      )}
    </div>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="codeword rounded bg-paper2 px-1.5 py-0.5 text-[0.92em]">
      {children}
    </code>
  )
}

export function prettyChar(ch: string): string {
  if (ch === ' ') return '␣'
  if (ch === '\t') return '⇥'
  if (ch === '\n') return '⏎'
  if (ch === '\r') return '⇤'
  return ch
}

/** Symbol cell: shows printable char or a control glyph, with the raw code point underneath. */
export function SymBadge({ sym, size = 'md' }: { sym: string; size?: 'md' | 'sm' }) {
  const cp = sym.codePointAt(0)!
  const label = prettyChar(sym)
  const ctrl = cp < 0x20 || cp === 0x7f
  return (
    <span className="inline-flex items-center gap-2" title={sym}>
      <span
        className={`grid place-items-center border rounded ${
          ctrl ? 'border-rust/40 bg-rustbg text-rustd' : 'border-hair2 bg-paper text-ink'
        } ${size === 'sm' ? 'h-6 w-6 text-[11px]' : 'h-7 w-7 text-[13px]'}`}
      >
        {label}
      </span>
      <span className="font-mono text-[10px] text-faint">U+{cp.toString(16).toUpperCase().padStart(4, '0')}</span>
    </span>
  )
}