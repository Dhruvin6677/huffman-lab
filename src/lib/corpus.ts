export interface CorpusFile {
  id: string
  title: string
  kind: string
  comment: string
  content: string
}

const dna = (() => {
  const motif = 'ACGTACGTCGATCGATGCGATCGTACGTAGCGATCGTA'
  let seed = 0x5eed
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0xffffffff
  }
  let s = ''
  for (let i = 0; i < 2100; i++) s += motif[i % motif.length]
  const bias: [string, number][] = [
    ['C', 0.36],
    ['G', 0.31],
    ['A', 0.18],
    ['T', 0.15],
  ]
  for (let i = 0; i < 900; i++) {
    const r = rnd()
    let acc = 0
    let pick = bias[bias.length - 1][0]
    for (const [ch, p] of bias) {
      acc += p
      if (r <= acc) {
        pick = ch
        break
      }
    }
    s += pick
  }
  return s
})()

const uniform = (() => {
  const alpha = 'abcdefghijklmnopqrstuvwxyz'
  let s = ''
  for (let i = 0; i < 2400; i++) s += alpha[i % alpha.length]
  return s
})()

const marksheet = `RollNo,Course,Class,Assgn,P1,P2,Quiz,EndSem,Total,Grade
2023A7PS001,DSA,BE1,9,18,17,8,42,94,A+
2023A7PS002,DSA,BE1,8,16,18,9,44,95,A+
2023A7PS003,DSA,BE1,10,15,15,7,36,83,A
2023A7PS004,DSA,BE1,7,14,16,8,40,85,A
2023A7PS005,DSA,BE1,9,17,14,6,32,78,B
2023A7PS006,DSA,BE1,8,15,17,9,38,87,A
2023A7PS007,DSA,BE1,6,13,15,5,29,68,C
2023A7PS008,DSA,BE1,8,16,16,7,41,88,A
2023A7PS009,DSA,BE1,9,18,18,9,45,99,A+
2023A7PS010,DSA,BE1,8,17,15,8,39,87,A
2023A7PS011,DSA,BE1,7,14,14,6,33,74,B
2023A7PS012,DSA,BE1,8,16,17,8,42,91,A+
2023A7PS013,DSA,BE1,10,18,16,7,40,91,A+
2023A7PS014,DSA,BE1,9,15,18,9,43,94,A+
2023A7PS015,DSA,BE1,8,14,15,7,35,79,B
2023A7PS016,DSA,BE1,7,16,14,6,31,74,B
2023A7PS017,DSA,BE1,8,17,16,8,38,87,A
2023A7PS018,DSA,BE1,9,18,17,9,44,97,A+
2023A7PS019,DSA,BE1,8,13,15,5,30,71,C
2023A7PS020,DSA,BE1,8,16,16,8,40,88,A
2023A7PS021,DSA,BE2,9,17,15,7,39,87,A
2023A7PS022,DSA,BE2,8,18,18,9,46,99,A+
2023A7PS023,DSA,BE2,7,14,16,8,37,82,A
2023A7PS024,DSA,BE2,8,15,17,6,33,79,B
2023A7PS025,DSA,BE2,9,16,16,8,41,90,A+
2023A7PS026,DSA,BE2,8,18,15,7,38,86,A
2023A7PS027,DSA,BE2,6,13,14,5,28,66,C
2023A7PS028,DSA,BE2,8,17,16,9,42,92,A+
2023A7PS029,DSA,BE2,9,15,18,8,43,93,A+
2023A7PS030,DSA,BE2,8,16,15,7,36,82,A
2023A7PS031,DSA,BE2,10,18,17,8,44,97,A+
2023A7PS032,DSA,BE2,7,14,16,6,35,78,B
2023A7PS033,DSA,BE2,8,16,17,9,40,90,A+
2023A7PS034,DSA,BE2,9,17,18,7,41,92,A+
2023A7PS035,DSA,BE2,8,15,14,6,32,75,B
2023A7PS036,DSA,BE2,8,18,16,8,39,89,A
2023A7PS037,DSA,BE2,7,13,15,5,29,69,C
2023A7PS038,DSA,BE2,8,16,16,8,38,86,A
2023A7PS039,DSA,BE2,9,17,17,9,45,97,A+
2023A7PS040,DSA,BE2,8,15,15,7,34,79,B`

const python = `# heap of nodes for the Huffman construction
import heapq
from collections import Counter


class Node:
    __slots__ = ("sym", "freq", "left", "right")

    def __init__(self, sym, freq, left=None, right=None):
        self.sym = sym
        self.freq = freq
        self.left = left
        self.right = right

    def __lt__(self, other):
        return self.freq < other.freq


def build_tree(text):
    counts = Counter(text)
    heap = [Node(ch, n) for ch, n in sorted(counts.items())]
    heapq.heapify(heap)
    while len(heap) > 1:
        lo = heapq.heappop(heap)   # least frequent
        hi = heapq.heappop(heap)   # second least frequent
        heapq.heappush(heap, Node(None, lo.freq + hi.freq, lo, hi))
    return heap[0]


def assign(root, prefix="", table=None):
    table = table if table is not None else {}
    if root.sym is not None:
        table[root.sym] = prefix or "0"
        return table
    assign(root.left, prefix + "0", table)
    assign(root.right, prefix + "1", table)
    return table


def encode(text):
    root = build_tree(text)
    table = assign(root)
    return "".join(table[c] for c in text), root, table


def decode(bits, root):
    out, node = [], root
    for bit in bits:
        node = node.left if bit == "0" else node.right
        if node.sym is not None:
            out.append(node.sym)
            node = root
    return "".join(out)


def report(text):
    bits, root, table = encode(text)
    n = len(text)
    huff = len(bits)
    fixed = n * (len(table).bit_length() - 1 if len(table) > 1 else 1)
    print(f"symbols={len(table)} fixed={fixed} huffman={huff} "
          f"saved={(1 - huff / fixed) * 100:.1f}%")
    print(decode(bits, root) == text and "round-trip: OK" or "round-trip: FAIL")


report("peter piper picked a peck of pickled peppers")
report("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
report("the quick brown fox jumps over the lazy dog")`

const prose = `A good compression scheme is a bet against repetition. Every text file is
built from only so many distinct symbols, and yet those symbols almost
never appear equally often. English prose, a spreadsheet, a program, a
genome: each one carries its own skewed distribution of characters. Huffman
coding is the argument that we should price the alphabet accordingly — give
the frequent few the shortest words and let the rare tail pay for length.

The method is greedy in the most literal sense. Of all the symbols, pick
the two cheapest fragments of text and weld them together; their joined
weight now stands in for both, and the decision is never revisited. Repeat
until a single root remains. That local rule — always the two smallest —
turns out to be globally optimal for prefix codes, and the proof is an
exchange argument: in any optimal tree the two deepest leaves exist, and
they may always be chosen as our pair.

What the construction buys is a prefix-free vocabulary: no codeword is the
start of another, so a stream of bits can be read left to right with no
ambiguity about where one symbol ends and the next begins. The reader
simply follows the bits down the tree, and every leaf is a full stop.

Entropy sets the floor. If the source emits symbol s with probability p(s),
information theory says a code needs at least the weighted sum of
log(1/p) bits per symbol, and Huffman's average word length comes within
one bit of that bound; the gap is the redundancy you pay for whole,
integer-length words. When the distribution is wildly uneven the payoff is
large: a heavily skewed file can be halved or better. When the alphabet is
uniform there is nothing to exploit — every codeword runs the same length
and Huffman degenerates into plain fixed-width encoding wearing a longer
name.

This matters beyond theory because bottled-up redundancy is expensive.
Real formats lean on the same trick: DEFLATE, the engine behind ZIP, PNG
and gzip, pairs LZ sliding-window matching with a Huffman pass over the
remaining stream, and JPEG finishes its DCT coefficients with Huffman
coding too. The tree built in a classroom on a paragraph is the same tree
packing photographs into archives — seventy years later it still is the
cheapest good answer we know.`

const jsonBlob = `{
  "experiment": {
    "name": "huffman-cli",
    "run": 47,
    "profile": "default",
    "flags": {
      "verbose": true,
      "debug": false,
      "stats": true,
      "hexdump": false,
      "header": "HUF1",
      "tieBreak": "stable-by-symbol"
    },
    "corpus": [
      { "file": "prose.txt",      "bytes": 11822, "ratio": 0.62 },
      { "file": "marksheet.csv",  "bytes": 8120,  "ratio": 0.57 },
      { "file": "genome.fa",      "bytes": 40960, "ratio": 0.51 },
      { "file": "config.json",    "bytes": 2311,  "ratio": 0.71 },
      { "file": "uniform.txt",    "bytes": 8192,  "ratio": 1.00 },
      { "file": "main.py",        "bytes": 6344,  "ratio": 0.69 }
    ],
    "runTimeMs": 81,
    "host": "node-22-windows-x64",
    "notes": [
      "rebuilt tree from stored frequencies",
      "payload padded to a byte boundary",
      "container overhead charged to the report"
    ]
  }
}`

export const CORPUS: CorpusFile[] = [
  {
    id: 'prose',
    title: 'prose.txt',
    kind: 'English prose',
    comment: 'Natural-language paragraph — a skewed alphabet of letters, spaces and punctuation.',
    content: prose,
  },
  {
    id: 'marksheet',
    title: 'marksheet.csv',
    kind: 'CSV marks table',
    comment: 'Studio marks database — a small alphabet dominated by digits, commas and commas.',
    content: marksheet,
  },
  {
    id: 'dna',
    title: 'genome.fa',
    kind: 'Genomic letter stream',
    comment: 'Four-letter alphabet with a biased distribution (C/G heavy) plus a repeated motif.',
    content: dna,
  },
  {
    id: 'code',
    title: 'huffman.py',
    kind: 'Source code',
    comment: 'Reference Python implementation — mixed-case identifiers, indentation, comments.',
    content: python,
  },
  {
    id: 'json',
    title: 'config.json',
    kind: 'Structured JSON',
    comment: 'Nested configuration — repeated keys and punctuation inflating the symbol table.',
    content: jsonBlob,
  },
  {
    id: 'uniform',
    title: 'uniform.txt',
    kind: 'Uniform alphabet',
    comment: 'Generated stream cycling a–z evenly. Huffman has nothing to exploit here.',
    content: uniform,
  },
]

export interface WorkbenchSample {
  id: string
  label: string
  content: string
}

export const WORKBENCH_SAMPLES: WorkbenchSample[] = [
  {
    id: 'classic',
    label: 'Classic pair',
    content:
      'ABRACADABRA! ABRACADABRA!\n\nSee how the A, the R and the space own this message — ' +
      'Huffman should hand them the shortest codewords and pay the incidental B, C and D in length.',
  },
  {
    id: 'dna',
    label: 'DNA strand',
    content: 'ACGTGCATGTCAGTGCATGACGTACGTACGTAGCATCGATCGTAGCATCGATGCATCGATCGTAGCTA',
  },
  {
    id: 'code',
    label: 'Python source',
    content:
      'def huffman(freqs):\n    heap = build(freqs)\n    while len(heap) > 1:\n        a = pop(heap)   # smallest\n        b = pop(heap)   # second smallest\n        push(heap, Node(a.weight + b.weight, a, b))\n    return heap[0]\n',
  },
  {
    id: 'marks',
    label: 'CSV rows',
    content:
      'Name,T1,T2,Quiz,End\nAarav,18,17,8,44\nIshaan,16,18,9,41\nRiya,17,15,7,36\nAnanya,14,16,8,40\nKabir,15,14,6,33\nDiya,18,17,9,45',
  },
  {
    id: 'tweeter',
    label: 'Uniform alphabet',
    content: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz',
  },
]

/** Codes never overlap the map; produce a compact stable ordinal label for a symbol. */
export function sampleById(id: string): WorkbenchSample | undefined {
  return WORKBENCH_SAMPLES.find((s) => s.id === id)
}