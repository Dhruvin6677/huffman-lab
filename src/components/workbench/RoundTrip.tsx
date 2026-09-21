'use client'

import { useMemo, useState, useCallback } from 'react'
import { encodeText, decodeFile, downloadBlob, textToBase64 } from '@/lib/huf-io'
import { sizeBytes, num } from '@/lib/format'

export default function RoundTrip({ text, fileName }: { text: string; fileName: string | null }) {
  const archive = useMemo(() => (text ? encodeText(text) : null), [text])

  const [decoded, setDecoded] = useState<{ text: string; name: string; meta: { payloadBits: number } } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [base64Open, setBase64Open] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback((file: File) => {
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const bytes = new Uint8Array(reader.result as ArrayBuffer)
        const { text: out, meta } = decodeFile(bytes)
        setDecoded({ text: out, name: file.name, meta })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'unreadable archive')
        setDecoded(null)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const selfDecode = () => {
    if (!archive) return
    try {
      const { text: out, meta } = decodeFile(archive.bytes)
      setDecoded({ text: out, name: 'archive.huf', meta })
      setError(null)
    } catch {
      setError('self decode failed — this should never happen')
    }
  }

  const matches = decoded !== null && decoded.text === text
  const b64 = archive ? textToBase64(archive.bytes) : ''

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ---- ENCODE SIDE ---- */}
      <div className="flex flex-col border border-hair bg-surface">
        <div className="border-b border-hair bg-paper px-5 py-3">
          <p className="microlabel text-rust">Encode → .huf archive</p>
        </div>
        <div className="flex-1 p-5">
          {archive ? (
            <>
              <dl className="grid grid-cols-2 gap-px border border-hair bg-hair sm:grid-cols-4">
                <div className="bg-surface px-4 py-3">
                  <dt className="microlabel">Container</dt>
                  <dd className="mt-1 font-mono text-[16px] font-medium tabular-nums">
                    {sizeBytes(archive.meta.totalBytes)}
                  </dd>
                </div>
                <div className="bg-surface px-4 py-3">
                  <dt className="microlabel">Header</dt>
                  <dd className="mt-1 font-mono text-[16px] font-medium tabular-nums">
                    {sizeBytes(archive.meta.overheadBytes)}
                  </dd>
                </div>
                <div className="bg-surface px-4 py-3">
                  <dt className="microlabel">Payload</dt>
                  <dd className="mt-1 font-mono text-[16px] font-medium tabular-nums">
                    {sizeBytes(archive.meta.payloadBytes)}
                  </dd>
                </div>
                <div className="bg-surface px-4 py-3">
                  <dt className="microlabel">Symbols</dt>
                  <dd className="mt-1 font-mono text-[16px] font-medium tabular-nums">
                    {num(archive.meta.codes)}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-[12.5px] leading-relaxed text-ink2">
                HUF1 container: 4-byte marker, u16 table width, u32 codepoints +
                frequencies (the decoder rebuilds the tree, never stores it),
                u32 payload length, u8 padding, then the packed bytes.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn btn-rust"
                  onClick={() => downloadBlob(archive.bytes, fileName ? `${fileName.replace(/\.txt$/, '')}.huf` : 'archive.huf')}
                >
                  ⤓ Download .huf
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setBase64Open(!base64Open)}>
                  {base64Open ? 'hide base64 —' : 'copy as base64'}
                </button>
              </div>
              {base64Open && (
                <div className="mt-4">
                  <textarea
                    readOnly
                    className="field h-28 w-full border border-hair bg-paper p-3 text-[11.5px]"
                    value={b64}
                    onFocus={(e) => e.currentTarget.select()}
                    onCopy={() => {}}
                  />
                  <p className="mt-1 text-[12px] text-faint">
                    {num(b64.length)} chars of base64 — paste it anywhere and decode with the panel opposite.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="font-mono text-[12.5px] text-mute">nothing to archive yet — add input on the left.</p>
          )}
        </div>
      </div>

      {/* ---- DECODE SIDE ---- */}
      <div className="flex flex-col border border-hair bg-surface">
        <div className="border-b border-hair bg-paper px-5 py-3">
          <p className="microlabel text-green">Decode ← .huf archive</p>
        </div>
        <div className="flex-1 p-5">
          <div
            className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed px-4 py-8 text-center transition-colors ${
              dragOver ? 'border-rust bg-rustbg' : 'border-hair2'
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const f = e.dataTransfer.files?.[0]
              if (f) handleFile(f)
            }}
          >
            <input
              id="huf-file"
              type="file"
              accept=".huf,application/octet-stream"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
                e.target.value = ''
              }}
            />
            <label htmlFor="huf-file" className="cursor-pointer text-[13px] font-medium text-ink2">
              drop a <span className="text-rust">.huf</span> here
            </label>
            <p className="text-[12px] text-faint">or click to browse · or decode the archive above</p>
            <button type="button" className="btn btn-sm mt-2" onClick={selfDecode} disabled={!archive}>
              decode archive above ▸
            </button>
          </div>

          {error && (
            <p className="mt-3 border border-rust/50 bg-rustbg px-3 py-2 font-mono text-[12px] text-rustd">
              ✗ {error}
            </p>
          )}

          {decoded && !error && (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] text-mute">
                  {decoded.name} · {num(decoded.meta.payloadBits)} bits of payload
                </p>
                <span
                  className={`font-mono text-[11px] px-2 py-1 border ${
                    matches ? 'border-green/40 bg-greenbg text-green' : 'border-rust/40 bg-rustbg text-rustd'
                  }`}
                >
                  {matches ? '✓ ROUND-TRIP — identical' : '⚠ differs from current input'}
                </span>
              </div>
              <div className="mt-2 max-h-40 overflow-auto border border-hair bg-paper p-3 font-mono text-[12px] leading-relaxed text-ink2">
                {decoded.text.slice(0, 2000)}
                {decoded.text.length > 2000 && <span className="text-faint"> … +{num(decoded.text.length - 2000)} chars</span>}
              </div>
              {matches && (
                <p className="mt-2 text-[12px] text-green">
                  symbols decode in specular order; every bit follows 0→left, 1→right from the root. no padding bit survives.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}