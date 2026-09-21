const fmt = new Intl.NumberFormat('en-US')

export function num(x: number): string {
  return fmt.format(Math.round(x))
}

export function utf8ByteLength(s: string): number {
  let n = 0
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    n += c <= 0x7f ? 1 : c <= 0x7ff ? 2 : c <= 0xffff ? 3 : 4
  }
  return n
}

export function num1(x: number): string {
  return fmt.format(Math.round(x * 10) / 10)
}

export function pct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)}%`
}

/** 1432 → "1,432 B", 1.31e6 → "1.31 MB" */
export function sizeBytes(n: number): string {
  if (n < 1024) return `${num(n)} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export function bitsPretty(bits: number): string {
  return `${num(bits)} bit${bits === 1 ? '' : 's'}`
}

export function groupBits(bits: string, group = 8, every = 4): string {
  const parts: string[] = []
  for (let i = 0; i < bits.length; i += group) {
    parts.push(bits.slice(i, i + group))
  }
  // visual spacer every `every` groups
  const spaced: string[] = []
  for (let i = 0; i < parts.length; i++) {
    if (i > 0 && i % every === 0) spaced.push('')
    spaced.push(parts[i])
  }
  return spaced.join(' ')
}

export function hexDump(bytes: number[], cols = 8): string[][] {
  const rows: string[][] = []
  for (let i = 0; i < bytes.length; i += cols) {
    rows.push(
      bytes.slice(i, i + cols).map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    )
  }
  return rows
}

export function prettyChar(ch: string): string {
  if (ch === ' ') return '␣'
  if (ch === '\t') return '⇥'
  if (ch === '\n') return '⏎'
  if (ch === '\r') return '⇤'
  return ch
}

export function isControl(ch: string): boolean {
  const c = ch.codePointAt(0)!
  return c < 0x20 || c === 0x7f || c === 0xa0
}

/** Range projection for merging partial subtrees onto a scrubber 0..1 */
export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}