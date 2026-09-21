import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-hair bg-white">
      <div className="wrap flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-ink2">
          Huffman Lab — BCSE204P · Design &amp; Analysis of Algorithms · Exp 1
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" aria-label="Footer">
          <Link className="text-ink2 hover:text-rust" href="/">
            Workbench
          </Link>
          <Link className="text-ink2 hover:text-rust" href="/tree">
            Tree
          </Link>
          <Link className="text-ink2 hover:text-rust" href="/report">
            Report
          </Link>
          <Link className="text-ink2 hover:text-rust" href="/method">
            Method
          </Link>
        </nav>
      </div>
    </footer>
  )
}