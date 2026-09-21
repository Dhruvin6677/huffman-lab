import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  analyze,
  buildTree,
  buildSteps,
  charFrequencies,
  decodeFromBits,
  deriveCodes,
  encodeToBits,
  lengthHistogram,
  packBits,
} from './huffman'
import { decodeFile, encodeText } from './huf-io'
import { CORPUS } from './corpus'

test('stacked skew: expensive frequent symbol gets the short code', () => {
  const text = 'aaaabbbbccccdddd'
  const a = analyze(text)
  assert.equal(a.codeEntries.find((e) => e.sym === 'a')!.length, 2)
  assert.ok(a.bits <= a.fixedLenBits)
})

test('prefix-free and Kraft on a messy sample', () => {
  const text =
    'woot woot — packing (bits) & bytes, properly. Newlines!\n\tTabs\tand “quotes” 😄'
  const a = analyze(text)
  const codes = a.codeEntries.map((e) => e.code)
  for (let i = 0; i < codes.length; i++) {
    for (let j = 0; j < codes.length; j++) {
      if (i !== j) {
        assert.ok(!codes[i].startsWith(codes[j]), `${codes[i]} prefixes ${codes[j]}`)
      }
    }
  }
  assert.ok(a.kraftSum <= 1 + 1e-9)
  assert.equal(a.isPrefixFree, true)
})

test('entropy is a lower bound on average length', () => {
  const texts = [
    'abcdefghijklmnopqrstuvwxyz',
    'aaaaaaabbbbbcccccde',
    'the quick brown fox jumps over the lazy dog, again and again and again',
  ]
  for (const t of texts) {
    const a = analyze(t)
    assert.ok(a.avgLen >= a.entropy - 1e-9)
    assert.ok(a.avgLen < a.entropy + 1)
  }
})

test('round-trip on unicode and whitespace', () => {
  const samples = [
    'سلام، هذا نص بسيط',
    'தமிழ் எழுத்துக்கள் மற்றும் संस्कृत!',
    'emoji 🧪🧬 と改行\nとタブ\t end',
    'single',
    'a',
    '',
  ]
  for (const t of samples) {
    assert.equal(decodeBitsRoundtrip(t), t)
  }
})

test('single-symbol alphabet encodes to zero bits', () => {
  const a = analyze('zzzzzzzzzz')
  assert.equal(a.distinct, 1)
  assert.equal(a.bits, 0)
  assert.equal(a.bytes, 0)
  assert.equal(decodeBitsRoundtrip('zzzzz'), 'zzzzz')
})

test('HUF1 container round-trips text and tracks overhead honestly', () => {
  const text =
    'Huffman containers: store frequencies, rebuild the tree, decode. ☕ ' +
    'https://example.in/huf1 v3 revisited\n'
  const { bytes, meta } = encodeText(text)
  const { text: out, meta: m2 } = decodeFile(bytes)
  assert.equal(out, text)
  assert.equal(meta.totalBytes, bytes.length)
  assert.equal(m2.overheadBytes + m2.payloadBytes, meta.totalBytes)
  assert.equal(m2.codes, meta.codes)
})

test('container round-trip on corpus files', () => {
  for (const f of CORPUS) {
    const { bytes } = encodeText(f.content)
    const { text, meta } = decodeFile(bytes)
    assert.equal(text, f.content)
    assert.ok(meta.totalBytes > meta.payloadBytes)
  }
})

test('bit packing pads correctly', () => {
  assert.deepEqual(packBits('11111111'), { bytes: [0xff], pad: 0 })
  assert.deepEqual(packBits('111111101'), { bytes: [0xfe, 0x80], pad: 7 })
  assert.deepEqual(packBits('10101'), { bytes: [0b10101000], pad: 3 })
  assert.deepEqual(packBits(''), { bytes: [], pad: 0 })
})

test('deterministic construction and identical codes across runs', () => {
  const f = charFrequencies('mississippi river')
  const c1 = deriveCodes(buildTree(f))
  const c2 = deriveCodes(buildTree(f))
  assert.deepEqual([...c1.entries()].sort(), [...c2.entries()].sort())
})

test('construction steps replay the greedy merges', () => {
  const f = charFrequencies('aabbbcccc')
  const steps = buildSteps(f)
  assert.equal(steps.length, 2) // 3 distinct symbols -> 2 merges
  const first = steps[0]
  assert.equal(first.newWeight, first.leftWeight + first.rightWeight)
})

test('histogram aggregates lengths', () => {
  const a = analyze('the cat sat')
  const h = lengthHistogram(a.codes)
  const total = h.reduce((s, x) => s + x.count, 0)
  assert.equal(total, a.distinct)
})

function decodeBitsRoundtrip(text: string): string {
  if (!text) return ''
  const f = charFrequencies(text)
  const root = buildTree(f)
  const codes = deriveCodes(root)
  return decodeFromBits(encodeToBits(text, codes), root)
}