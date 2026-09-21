'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { analyze, type Analysis } from '@/lib/huffman'
import { encodeText } from '@/lib/huf-io'
import { sizeBytes, num } from '@/lib/format'
import { WORKBENCH_SAMPLES } from '@/lib/corpus'
import { PageHead, Fig } from '@/components/ui'
import CodeTable from './CodeTable'
import BitsPane from './BitsPane'
import CostBars from './CostBars'
import RoundTrip from './RoundTrip'

const LS_KEY = 'huffman-lab:text'

function utf8Bytes(s: string): number {
  let n = 0
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    n += c <= 0x7f ? 1 : c <= 0x7ff ? 2 : c <= 0xffff ? 3 : 4
  }
  return n
}

export default function Workbench() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [pinned, setPinned] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (loaded) return
    const saved = localStorage.getItem(LS_KEY)
    const t = setTimeout(() => {
      setText(saved && saved.trim() ? saved : (WORKBENCH_SAMPLES[0].content ?? ''))
      setLoaded(true)
    }, 0)
    return () => clearTimeout(t)
  }, [loaded])

  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => localStorage.setItem(LS_KEY, text), 250)
    return () => clearTimeout(t)
  }, [text, loaded])

  const analysis = useMemo<Analysis | null>(() => (text ? analyze(text) : null), [text])
  const packMeta = useMemo(() => (text ? encodeText(text).meta : null), [text])

  const updateFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setFileName(file.name)
      setText(String(reader.result ?? ''))
    }
    reader.readAsText(file)
  }, [])

  const handleSample = (id: string) => {
    setFileName(null)
    setText(WORKBENCH_SAMPLES.find((s) => s.id === id)?.content ?? '')
  }

  const clearAll = () => {
    setText('')
    setFileName(null)
  }

  const nText = text.length
  const nBytes = utf8Bytes(text)

  return (
    <>
      <PageHead
        idx="01"
        kicker="Workbench"
        title={
          <>
            Compress anything,
            <br />
            watch the bits fall.
          </>
        }
        lede={
          <>
            Type, paste, or drop a file. Huffman coding — computed live — builds
            the optimal prefix code for this exact alphabet and shows you every
            bit it spends. Round-trip it, download the archive, open it in the
            visualiser. All of it happens in your browser.
          </>
        }
        meta={
          analysis
            ? [
                { k: 'Distinct symbols', v: `${num(analysis.distinct)}` },
                { k: 'Input symbols', v: num(nText) },
                { k: 'Entropy H(S)', v: `${analysis.entropy.toFixed(3)} bit` },
                {
                  k: 'Huffman payload',
                  v:
                    packMeta && packMeta.payloadBytes > 0 ? (
                      <>
                        {num(analysis.bits)} bit · {sizeBytes(packMeta.payloadBytes)}
                      </>
                    ) : (
                      '0 bit'
                    ),
                },
              ]
            : [
                { k: 'Distinct symbols', v: '—' },
                { k: 'Input symbols', v: '—' },
                { k: 'Entropy H(S)', v: '—' },
                { k: 'Huffman payload', v: '—' },
              ]
        }
      />

      {/* ---- input zone ---- */}
      <section className="wrap">
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair bg-paper px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="btn btn-sm"
                onClick={() => fileInput.current?.click()}
                type="button"
              >
                ⬆ Upload .txt
              </button>
              <input
                ref={fileInput}
                type="file"
                accept=".txt,.md,.csv,.py,.json,.log,.c,.ts,text/plain"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) updateFile(f)
                  e.target.value = ''
                }}
              />
              <span className="mx-1 hidden h-5 w-px self-center bg-hair2 sm:block" />
              {WORKBENCH_SAMPLES.map((s) => (
                <button key={s.id} className="chip" onClick={() => handleSample(s.id)} type="button">
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.1em] text-mute">
              {fileName && <span className="hidden max-w-[180px] truncate text-rust md:inline">{fileName}</span>}
              <span>
                {num(nText)} ch · {num(nBytes)} B
              </span>
              {text && (
                <button className="link font-mono text-[11px] normal-case tracking-normal" onClick={clearAll} type="button">
                  clear
                </button>
              )}
            </div>
          </div>

          <div className="fieldzone dotgrid px-4 py-2">
            <textarea
              className="field min-h-[210px] px-1 py-3"
              placeholder={
                'huf$ feed me text — a paragraph, a table, a genome, anything.\n\nTry a sample above, upload a .txt, or start typing…'
              }
              value={text}
              spellCheck={false}
              onChange={(e) => {
                setText(e.target.value)
                setFileName(null)
              }}
            />
          </div>

          {analysis && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hair bg-paper px-4 py-3">
              <p className="font-mono text-[11.5px] text-ink2">
                <span className="text-rust">■</span> optimal tree ready ·
                {analysis.isPrefixFree ? ' prefix-free ✓' : ' prefix-free ✗'} ·{' '}
                <span className="text-green">Σ2^(−ℓ) = {analysis.kraftSum.toFixed(4)}</span> ·{' '}
                O(distinct) heap · O(n) encode
              </p>
              <button className="btn btn-rust btn-sm" onClick={() => router.push('/tree')} type="button">
                Open in visualiser ↗
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ---- results ---- */}
      {analysis && packMeta ? (
        <div className="wrap mt-16 space-y-16">
          {/* FIG 01 — ledger */}
          <Fig num="01" title="Entropy ledger">
            <div className="grid gap-px border border-hair bg-hair sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-surface p-5">
                <p className="microlabel">Entropy · H(S)</p>
                <p className="mt-2 font-mono text-[26px] font-medium tabular-nums text-rust">
                  {analysis.entropy.toFixed(3)}
                  <span className="ml-1 text-[12px] text-mute">bit/sym</span>
                </p>
              </div>
              <div className="bg-surface p-5">
                <p className="microlabel">Av. code length · L̄</p>
                <p className="mt-2 font-mono text-[26px] font-medium tabular-nums">
                  {analysis.avgLen.toFixed(3)}
                  <span className="ml-1 text-[12px] text-mute">bit/sym</span>
                </p>
              </div>
              <div className="bg-surface p-5">
                <p className="microlabel">Redundancy · L̄ − H</p>
                <p className="mt-2 font-mono text-[26px] font-medium tabular-nums">
                  {Math.max(0, analysis.redundancy).toFixed(3)}
                  <span className="ml-1 text-[12px] text-mute">bit/sym</span>
                </p>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">
                  the price of whole words
                </p>
              </div>
              <div className="bg-surface p-5">
                <p className="microlabel">Depth range</p>
                <p className="mt-2 font-mono text-[26px] font-medium tabular-nums">
                  {analysis.minLen}
                  <span className="text-faint">…</span>
                  {analysis.maxLen}
                  <span className="ml-1 text-[12px] text-mute">bit</span>
                </p>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">
                  shallow ⇄ deep leaves
                </p>
              </div>
            </div>
          </Fig>

          {/* FIG 02 — costs */}
          <Fig num="02" title="What a fixed-width alphabet would charge">
            <CostBars analysis={analysis} packMeta={packMeta!} rawUtf8Bytes={nBytes} />
          </Fig>

          {/* FIG 03 — code table */}
          <Fig num="03" title="Codewords — hover to trace each into the bitstream">
            <CodeTable
              entries={analysis.codeEntries}
              hovered={hovered}
              pinned={pinned}
              onHover={setHovered}
              onPin={setPinned}
            />
          </Fig>

          {/* FIG 04 — bitstream */}
          <Fig num="04" title="The packed payload">
            <BitsPane
              text={text}
              analysis={analysis}
              hovered={hovered}
              pinned={pinned}
              onHover={setHovered}
              onPin={setPinned}
            />
          </Fig>

          {/* FIG 05 — round trip */}
          <Fig num="05" title="Decompression — prove the round-trip">
            <RoundTrip
              text={text}
              fileName={fileName}
            />
          </Fig>

          <p className="border-t border-hair pt-6 font-mono text-[11.5px] uppercase tracking-[0.12em] text-faint">
            fig. 01–05 · computed deterministically from the frequency table —
            see <Link className="link normal-case" href="/method">method</Link> for the tie-break rule
          </p>
        </div>
      ) : (
        <div className="wrap mt-14">
          <div className="terminal px-5 py-4 font-mono text-[13px] leading-relaxed">
            <p>
              <strong>huf$</strong> waiting for input<span className="caret" />
            </p>
            <p className="mt-2">
              paste text → builds frequency table → {analysis ? 'done' : ''}
            </p>
          </div>
        </div>
      )}
    </>
  )
}