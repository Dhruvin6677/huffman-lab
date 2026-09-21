'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Workbench', idx: '01' },
  { href: '/tree', label: 'Tree', idx: '02' },
  { href: '/report', label: 'Report', idx: '03' },
  { href: '/method', label: 'Method', idx: '04' },
]

export default function Header() {
  const path = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-hair bg-paper/90 backdrop-blur-sm">
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="grid h-8 w-8 place-items-center border border-ink/30 group-hover:border-rust transition-colors">
            <TreeGlyph />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-semibold tracking-tight">
              Huffman&nbsp;Lab
            </span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mute">
              BCSE204P · Exp&nbsp;1
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV.map((n) => {
            const active = path === n.href
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-2 font-mono text-[11.5px] uppercase tracking-[0.12em] transition-colors border ${
                  active
                    ? 'border-ink bg-ink text-paper'
                    : 'border-transparent text-ink2 hover:text-ink hover:border-hair2'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="text-rust mr-1.5">{n.idx}</span>
                {n.label}
              </Link>
            )
          })}
        </nav>

        <a
          href="https://en.wikipedia.org/wiki/Huffman_coding"
          target="_blank"
          rel="noreferrer"
          className="hidden lg:inline-flex font-mono text-[10.5px] uppercase tracking-[0.14em] text-mute hover:text-rust transition-colors border border-hair2 px-3 py-2"
        >
          1952 · D.A. Huffman ↖
        </a>
      </div>
    </header>
  )
}

export function TreeGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="15"
      height="15"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M10 3v14M10 3 3 8.5M10 3l7 5.5M10 8l-4.5 3.5M10 8l4.5 3.5" />
      <circle cx="10" cy="3" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="3" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="17" cy="8.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="5.5" cy="11.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="11.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}