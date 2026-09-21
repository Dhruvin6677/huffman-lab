import Link from 'next/link'
import { TreeGlyph } from './Header'

export default function Footer() {
  return (
    <footer className="mt-28 border-t border-hair bg-paper2">
      <div className="wrap">
        <div className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center border border-ink/30">
                <TreeGlyph />
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight">
                Huffman Lab
              </span>
            </div>
            <p className="mt-4 max-w-[36ch] text-sm text-ink2">
              A self-contained study of greedy strategy applied to file
              compression. Everything — encoding, tree construction, entropy
              accounting — runs in your browser, on your data.
            </p>
          </div>

          <div>
            <p className="microlabel">Explore</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link className="link" href="/">Workbench</Link></li>
              <li><Link className="link" href="/tree">Tree visualiser</Link></li>
              <li><Link className="link" href="/report">Compression report</Link></li>
              <li><Link className="link" href="/method">Method &amp; proof</Link></li>
            </ul>
          </div>

          <div>
            <p className="microlabel">Deliverables</p>
            <ul className="mt-4 space-y-2 text-sm text-ink2">
              <li>CLI-grade core library</li>
              <li>Huffman tree visualiser</li>
              <li>Ratio analysis, 6 files</li>
              <li>Fixed-length comparison</li>
            </ul>
          </div>

          <div>
            <p className="microlabel">Course mapping</p>
            <p className="mt-4 text-sm font-mono text-ink2">
              BCSE204P — Design &amp; Analysis of Algorithms
              <br />
              Exp 1 · Greedy Strategy: Huffman Coding
            </p>
            <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
              Huffman, D. A. (1952). A method for the
              <br />
              construction of minimum-redundancy codes.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-hair py-6 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
            © 2026 Huffman Lab — built as a course deliverable, not a demo site
          </p>
          <p className="font-mono text-[11px] text-faint">
            run locally: <span className="text-mute">npm i &amp;&amp; npm run dev</span>
          </p>
        </div>
      </div>
    </footer>
  )
}