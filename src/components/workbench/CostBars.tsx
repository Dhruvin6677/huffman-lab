import type { Analysis } from '@/lib/huffman'
import type { HufMeta } from '@/lib/huf-io'
import { sizeBytes, num, pct } from '@/lib/format'

export default function CostBars({
  analysis,
  packMeta,
  rawUtf8Bytes,
}: {
  analysis: Analysis
  packMeta: HufMeta
  rawUtf8Bytes: number
}) {
  const fixedBytes = analysis.fixedLenBytes
  const huffPayload = packMeta.payloadBytes
  const container = packMeta.totalBytes

  const rows = [
    { label: 'Original file', value: rawUtf8Bytes, hint: 'UTF-8 bytes as stored on disk', cls: '' },
    { label: 'Fixed-width code', value: fixedBytes, hint: `n × ${analysis.fixedWidth} bits per symbol`, cls: 'bg-hair2' },
    { label: 'Huffman payload', value: huffPayload, hint: 'Σ f·ℓ, padded to bytes', cls: 'bar-fill' },
    { label: 'Huffman container', value: container, hint: `+ ${sizeBytes(packMeta.overheadBytes)} header (table + counts)`, cls: 'bar-fill-green' },
  ]
  const max = Math.max(rawUtf8Bytes, fixedBytes, container, 1)

  const saveVsRaw = 1 - container / rawUtf8Bytes
  const saveVsFixed = 1 - container / fixedBytes

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="space-y-5 border border-hair bg-surface p-6">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <div>
                <span className="text-[13.5px] font-medium text-ink2">
                  {r.label}
                </span>
                <span className="ml-3 text-[12px] text-faint">{r.hint}</span>
              </div>
              <span className="font-mono text-[14px] font-medium tabular-nums">
                {sizeBytes(r.value)}
                <span className="ml-1 text-[10px] font-normal text-mute">
                  ({num(r.value)} B)
                </span>
              </span>
            </div>
            <div className="bar-track" style={{ height: 10 }}>
              <div
                className={r.cls === 'bar-fill-green' ? 'bar-fill bar-fill-green' : r.cls === 'bar-fill' ? 'bar-fill' : r.cls || 'bg-ink'}
                style={{ width: `${(r.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        <p className="pt-2 text-[12px] text-faint">
          bars scaled to the largest entry = {sizeBytes(max)}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="callout callout-ok flex-1">
          <p className="callout-title">Savings vs fixed-width</p>
          <p className="mt-2 font-mono text-[34px] font-medium leading-none text-green tabular-nums">
            {Math.max(0, saveVsFixed) >= 0.001 ? pct(saveVsFixed, 2) : '≈ 0%'}
          </p>
          <p className="mt-3 text-[13px] text-ink2">
            Huffman container vs the uniform-width code that costs{' '}
            {analysis.fixedWidth} bits per symbol, UI representation not tied to
            the file bytes.
          </p>
        </div>
        <div className="callout">
          <p className="callout-title">Savings vs stored file</p>
          <p className="mt-2 font-mono text-[34px] font-medium leading-none text-rust tabular-nums">
            {pct(Math.max(0, saveVsRaw), 2)}
          </p>
          <p className="mt-3 text-[13px] text-ink2">
            Container (header + payload) divided by the raw UTF-8 size of the
            file you fed it.
          </p>
        </div>
      </div>
    </div>
  )
}