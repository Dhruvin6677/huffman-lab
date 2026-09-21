import {
  buildTree,
  charFrequencies,
  decodeFromBits,
  deriveCodes,
  encodeToBits,
  packBits,
  type HuffNode,
} from './huffman'

/*
 * HUF1 container format (big-endian).
 *
 *   marker    u8[4]    "HUF1"
 *   codes     u16      number of distinct symbols
 *   table     codes × { u32 codepoint, u32 frequency }
 *   bits      u32      length of the packed payload in bits
 *   pad       u8       trailing zero bits appended to last byte (0..7)
 *   payload   u8[]     ceil(bits / 8) packed bytes
 *
 * Frequencies are stored instead of the tree: the decoder rebuilds the
 * identical tree by replaying the deterministic merge order.
 */

const MARKER = [0x48, 0x55, 0x46, 0x31] // "HUF1"

export interface HufMeta {
  codes: number
  payloadBits: number
  payloadBytes: number
  pad: number
  overheadBytes: number
  totalBytes: number
}

function pushU16(out: number[], v: number) {
  out.push((v >> 8) & 0xff, v & 0xff)
}
function pushU32(out: number[], v: number) {
  out.push((v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff)
}
function readU16(b: Uint8Array, o: number): number {
  return (b[o] << 8) | b[o + 1]
}
function readU32(b: Uint8Array, o: number): number {
  return (
    ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3]
  )
}

export function encodeText(text: string): { bytes: Uint8Array; meta: HufMeta } {
  const freq = charFrequencies(text)
  const root = buildTree(freq)
  const codes = deriveCodes(root)
  const bits = encodeToBits(text, codes)
  const { bytes: packed } = packBits(bits)

  const sorted = [...freq.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )

  const head: number[] = []
  pushU16(head, sorted.length)
  for (const [sym, f] of sorted) {
    pushU32(head, sym.codePointAt(0)!)
    pushU32(head, f)
  }

  const header = new Uint8Array(4 + 2 + sorted.length * 8 + 4 + 1)
  header.set(MARKER, 0)
  header.set(head, 4)
  header.set([(bits.length >>> 24) & 0xff, (bits.length >>> 16) & 0xff, (bits.length >>> 8) & 0xff, bits.length & 0xff], 4 + head.length)
  header[4 + head.length + 4] = 8 - ((bits.length % 8) || 8)

  const out = new Uint8Array(header.length + packed.length)
  out.set(header, 0)
  out.set(packed, header.length)

  const overheadBytes = header.length
  return {
    bytes: out,
    meta: {
      codes: sorted.length,
      payloadBits: bits.length,
      payloadBytes: packed.length,
      pad: header[header.length - 5],
      overheadBytes,
      totalBytes: out.length,
    },
  }
}

export function decodeFile(bytes: Uint8Array): { text: string; meta: HufMeta; tree: HuffNode } {
  if (bytes.length < 11 || bytes[0] !== 0x48 || bytes[1] !== 0x55 || bytes[2] !== 0x46 || bytes[3] !== 0x31) {
    throw new Error('Not a HUF1 file (missing marker)')
  }
  let o = 4
  const codes = readU16(bytes, o)
  o += 2
  const freq = new Map<string, number>()
  for (let i = 0; i < codes; i++) {
    const cp = readU32(bytes, o)
    const f = readU32(bytes, o + 4)
    o += 8
    const sym = String.fromCodePoint(cp)
    if (isNaN(cp) || cp < 0 || cp > 0x10ffff) throw new Error('Bad symbol codepoint')
    freq.set(sym, f)
  }
  if (bytes.length < o + 4 + 1) throw new Error('Truncated header')
  const payloadBits = readU32(bytes, o)
  const pad = bytes[o + 4]
  if (pad > 7) throw new Error('Bad padding count')
  o += 5
  const payloadBytes = Math.ceil(payloadBits / 8)
  if (bytes.length < o + payloadBytes) throw new Error('Truncated payload')

  const bits: string[] = []
  for (let i = 0; i < payloadBytes; i++) {
    const b = bytes[o + i]
    for (let j = 7; j >= 0; j--) bits.push((b >> j) & 1 ? '1' : '0')
  }
  const bitString = bits.join('').slice(0, payloadBits)

  const total = [...freq.values()].reduce((a, b) => a + b, 0)
  const tree = buildTree(freq)
  const text = freq.size === 1 ? Array(total).fill([...freq.keys()][0]).join('') : decodeFromBits(bitString, tree)

  return {
    text,
    tree,
    meta: {
      codes,
      payloadBits,
      payloadBytes,
      pad,
      overheadBytes: o,
      totalBytes: bytes.length,
    },
  }
}

export function downloadBlob(bytes: Uint8Array, name: string) {
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const blob = new Blob([buf], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function textToBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/(.{64})/g, '$1\n')
}