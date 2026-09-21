export interface HuffNode {
  id: number
  sym: string | null
  weight: number
  left: HuffNode | null
  right: HuffNode | null
}

export interface FreqEntry {
  sym: string
  freq: number
}

export interface CodeEntry {
  sym: string
  freq: number
  prob: number
  code: string
  length: number
}

export interface Analysis {
  text: string
  n: number
  distinct: number
  freqs: FreqEntry[]
  root: HuffNode
  codes: Map<string, string>
  codeEntries: CodeEntry[]
  entropy: number
  avgLen: number
  redundancy: number
  bits: number
  bytes: number
  rawUtf8Bytes: number
  rawBits: number
  fixedLenBits: number
  fixedLenBytes: number
  fixedWidth: number
  kraftSum: number
  isPrefixFree: boolean
  maxLen: number
  minLen: number
}

class MinHeap<T> {
  private a: T[]
  private cmp: (x: T, y: T) => number
  constructor(cmp: (x: T, y: T) => number) {
    this.a = []
    this.cmp = cmp
  }
  push(v: T) {
    const a = this.a
    a.push(v)
    let i = a.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (this.cmp(a[i], a[p]) >= 0) break
      ;[a[i], a[p]] = [a[p], a[i]]
      i = p
    }
  }
  pop(): T {
    const a = this.a
    const top = a[0]
    const last = a.pop()!
    if (a.length) {
      a[0] = last
      let i = 0
      for (;;) {
        const l = i * 2 + 1
        const r = l + 1
        let m = i
        if (l < a.length && this.cmp(a[l], a[m]) < 0) m = l
        if (r < a.length && this.cmp(a[r], a[m]) < 0) m = r
        if (m === i) break
        ;[a[i], a[m]] = [a[m], a[i]]
        i = m
      }
    }
    return top
  }
  peek(): T {
    return this.a[0]
  }
  get size() {
    return this.a.length
  }
  dump(): T[] {
    return [...this.a]
  }
}

let __id = 0
function nextId() {
  return __id++
}
function resetId() {
  __id = 0
}

export function charFrequencies(text: string): Map<string, number> {
  const m = new Map<string, number>()
  for (const ch of text) m.set(ch, (m.get(ch) ?? 0) + 1)
  return m
}

/**
 * Deterministic Huffman tree construction.
 * Leaves are ordered by (weight, symbol); ties during merge are broken by
 * construction id. The same multiset of (symbol, freq) therefore always
 * yields the identical tree — this is what lets the decoder rebuild the
 * tree purely from the stored frequency table.
 */
export function buildTree(freqMap: Map<string, number>): HuffNode {
  resetId()
  const heap = new MinHeap<HuffNode>((x, y) =>
    x.weight === y.weight ? x.id - y.id : x.weight - y.weight
  )
  const entries = [...freqMap.entries()].sort(
    (a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  )
  for (const [sym, freq] of entries) {
    heap.push({ id: nextId(), sym, weight: freq, left: null, right: null })
  }
  while (heap.size > 1) {
    const l = heap.pop()
    const r = heap.pop()
    heap.push({
      id: nextId(),
      sym: null,
      weight: l.weight + r.weight,
      left: l,
      right: r,
    })
  }
  if (heap.size === 0) throw new Error('no symbols to encode')
  return heap.pop()
}

function walk(
  node: HuffNode,
  prefix: string,
  out: Map<string, string>
): void {
  if (node.sym !== null) {
    out.set(node.sym, prefix)
    return
  }
  if (node.left) walk(node.left, prefix + '0', out)
  if (node.right) walk(node.right, prefix + '1', out)
}

export function deriveCodes(root: HuffNode): Map<string, string> {
  const out = new Map<string, string>()
  if (root.sym !== null) {
    out.set(root.sym, '')
    return out
  }
  walk(root, '', out)
  return out
}

export function analyze(text: string): Analysis {
  const freqMap = charFrequencies(text)
  const root = buildTree(freqMap)
  const codes = deriveCodes(root)
  const n = text.length
  const distinct = freqMap.size

  const freqs: FreqEntry[] = [...freqMap.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([sym, freq]) => ({ sym, freq }))

  let entropy = 0
  let avgLen = 0
  let bits = 0
  let rawUtf8Bytes = 0
  let rawBits = 0
  let maxLen = 0
  let minLen = Infinity
  const codeEntries: CodeEntry[] = freqs.map((f) => {
    const p = f.freq / n
    const code = codes.get(f.sym)!
    entropy -= p * Math.log2(p)
    avgLen += p * code.length
    bits += f.freq * code.length
    maxLen = Math.max(maxLen, code.length)
    minLen = Math.min(minLen, code.length)
    rawUtf8Bytes += byteLength(f.sym) * f.freq
    return { ...f, prob: p, code, length: code.length }
  })

  rawBits = rawUtf8Bytes * 8

  const fixedWidth = distinct <= 1 ? 0 : Math.max(1, Math.ceil(Math.log2(distinct)))
  const fixedLenBits = n * fixedWidth

  let kraftSum = 0
  for (const e of codeEntries) kraftSum += Math.pow(2, -e.length)
  const isPrefixFree = kraftSum <= 1 + 1e-9

  return {
    text,
    n,
    distinct,
    freqs,
    root,
    codes,
    codeEntries,
    entropy: Number.isFinite(entropy) && entropy > 0 ? entropy : 0,
    avgLen,
    redundancy: avgLen - entropy,
    bits,
    bytes: Math.ceil(bits / 8),
    rawUtf8Bytes,
    rawBits,
    fixedLenBits,
    fixedLenBytes: Math.ceil(fixedLenBits / 8),
    fixedWidth,
    kraftSum,
    isPrefixFree,
    maxLen,
    minLen: minLen === Infinity ? 0 : minLen,
  }
}

/** Encode full text to a bit string. Returns '' for a single-symbol alphabet. */
export function encodeToBits(text: string, codes: Map<string, string>): string {
  const parts: string[] = new Array(text.length)
  let i = 0
  for (const ch of text) parts[i++] = codes.get(ch) ?? ''
  return parts.join('')
}

/** Decode a bit string against a tree. */
export function decodeFromBits(bits: string, root: HuffNode): string {
  if (root.sym !== null) {
    return Array(root.weight).fill(root.sym).join('')
  }
  const out: string[] = []
  let node = root
  for (let i = 0; i < bits.length; i++) {
    node = bits[i] === '0' ? node.left! : node.right!
    if (node.sym !== null) {
      out.push(node.sym)
      node = root
    }
  }
  return out.join('')
}

export function byteLength(ch: string): number {
  const c = ch.codePointAt(0)!
  if (c <= 0x7f) return 1
  if (c <= 0x7ff) return 2
  if (c <= 0xffff) return 3
  return 4
}

export function packBits(bits: string): { bytes: number[]; pad: number } {
  const bytes: number[] = []
  let cur = 0
  let curLen = 0
  for (let i = 0; i < bits.length; i++) {
    cur = (cur << 1) | (bits[i] === '1' ? 1 : 0)
    curLen++
    if (curLen === 8) {
      bytes.push(cur)
      cur = 0
      curLen = 0
    }
  }
  let pad = 8 - curLen
  if (curLen === 0) pad = 0
  else bytes.push(cur << (8 - curLen))
  return { bytes, pad }
}

export interface ConstructionStep {
  index: number
  leftId: number
  rightId: number
  leftSym: string | null
  leftWeight: number
  rightSym: string | null
  rightWeight: number
  newWeight: number
  nodeId: number
  heap: { sym: string | null; weight: number; id: number }[]
}

/** Record every greedy merge so the tree page can replay the construction. */
export function buildSteps(freqMap: Map<string, number>): ConstructionStep[] {
  resetId()
  type H = { id: number; sym: string | null; weight: number; ref: HuffNode }
  const heap = new MinHeap<H>((x, y) =>
    x.weight === y.weight ? x.id - y.id : x.weight - y.weight
  )
  const refs = new Map<number, HuffNode>()
  const entries = [...freqMap.entries()].sort(
    (a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  )
  for (const [sym, freq] of entries) {
    const id = nextId()
    const node: HuffNode = { id, sym, weight: freq, left: null, right: null }
    refs.set(id, node)
    heap.push({ id, sym, weight: freq, ref: node })
  }
  const steps: ConstructionStep[] = []
  while (heap.size > 1) {
    const l = heap.pop()
    const r = heap.pop()
    const id = nextId()
    const node: HuffNode = {
      id,
      sym: null,
      weight: l.weight + r.weight,
      left: l.ref,
      right: r.ref,
    }
    refs.set(id, node)
    heap.push({ id, sym: null, weight: node.weight, ref: node })
    steps.push({
      index: steps.length,
      leftId: l.id,
      rightId: r.id,
      leftSym: l.sym,
      leftWeight: l.weight,
      rightSym: r.sym,
      rightWeight: r.weight,
      newWeight: node.weight,
      nodeId: id,
      heap: heap.dump().map((h) => ({ sym: h.sym, weight: h.weight, id: h.id })),
    })
  }
  return steps
}

/** Codes grouped by length, for the length-distribution chart. */
export function lengthHistogram(codes: Map<string, string>): {
  length: number
  count: number
}[] {
  const m = new Map<number, number>()
  for (const c of codes.values()) m.set(c.length, (m.get(c.length) ?? 0) + 1)
  return [...m.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([length, count]) => ({ length, count }))
}