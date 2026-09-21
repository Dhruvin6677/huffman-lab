'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Workbench' },
  { href: '/tree', label: 'Tree' },
  { href: '/report', label: 'Report' },
  { href: '/method', label: 'Method' },
]

export default function Header() {
  const path = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-hair bg-white/90 backdrop-blur-sm">
      <div className="wrap flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center border border-hair2 rounded">
            <TreeGlyph />
          </span>
          <span className="font-display text-[16px] font-bold tracking-tight">
            Huffman&nbsp;Lab
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Primary">
          {NAV.map((n) => {
            const active = path === n.href
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`px-3 py-2 text-[14px] rounded-md transition-colors ${
                  active ? 'text-rust font-medium' : 'text-ink2 hover:text-ink'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>
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