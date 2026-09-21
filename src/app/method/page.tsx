import { PageHead } from '@/components/ui'

export const metadata = { title: 'Method' }

export default function MethodPage() {
  return (
    <>
      <PageHead
        idx="04"
        kicker="Method"
        title={
          <>
            The greedy,
            <br />
            disassembled.
          </>
        }
        lede="Huffman coding is greedy strategy wearing its proof on its sleeve. This page is the write-up: the problem, the minimum-redundancy construction, the exchange argument that licenses the greedy move, the costs, and the file format this project ships in."
        meta={[
          { k: 'Choice', v: 'merge the two lightest subtrees' },
          { k: 'Proof', v: 'exchange argument' },
          { k: 'Bound', v: 'H(S) ≤ L̄ < H(S) + 1' },
          { k: 'Source', v: 'Huffman (1952), IRE Proc.' },
        ]}
      />

      <article className="wrap mt-10 space-y-14">
        {/* THE PROBLEM */}
        <section>
          <div className="figlabel mb-4">
            <span className="fignum">M.1</span>
            <span className="figtitle">The problem setting</span>
            <span className="flex-1" />
            <span className="fignum">■</span>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1.25fr_1fr]">
            <div className="prose-p space-y-4 text-[0.99rem] text-ink2">
              <p>
                We are given a text file as a stream of <em>symbols</em>. A fixed-width code
                mints the same number of bits for every symbol: with an alphabet Σ it needs{' '}
                <span className="font-mono">⌈log&#8322;|Σ|⌉</span> bits just to tell the symbols
                apart. That is uniform pricing — it assumes every symbol is equally an extra
                story. Real files never are.
              </p>
              <p>
                Huffman sets a <em>variable-length</em>, <em>prefix-free</em> code: frequent
                symbols earn short codewords, rare ones pay with length, and no codeword starts
                with another, so a concatenated bitstream stays uniquely decodable. The task is
                to minimise the expected cost
              </p>
              <p className="eq">
                cost&nbsp;=&nbsp;Σ<span className="eq-var">&nbsp;f(𝓈)·ℓ(𝓈)</span>
              </p>
              <p>
                where f(𝓈) is how often the symbol occurs and ℓ(𝓈) is its codeword length — the
                exact number this whole project charges to the file.
              </p>
            </div>
            <div className="callout self-start">
              <p className="callout-title">Why prefix-free?</p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ink2">
                If the code <span className="font-mono">a=0, b=1, c=01</span> were allowed, the
                stream <span className="font-mono">01</span> would be both <em>ac</em> and{' '}
                <em>b</em>. A prefix-free code turns symbols into leaves of the decode tree: the
                bits read like directions, and every leaf is a full stop. No separator ever needs
                shipping.
              </p>
            </div>
          </div>
        </section>

        {/* ALGORITHM */}
        <section>
          <div className="figlabel mb-4">
            <span className="fignum">M.2</span>
            <span className="figtitle">The construction</span>
            <span className="flex-1" />
            <span className="fignum">■</span>
          </div>
          <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
            <ol className="space-y-5">
              {[
                ['Tally', 'Count every distinct symbol in the input; each becomes a single-node tree carrying its frequency as a weight.'],
                ['Heap them', 'Drop all k trees into a min-heap keyed by weight (ties broken by symbol, then construction id — keeping the build deterministic).'],
                ['Merge', 'Pop the two lightest roots, weld them under a new internal node whose weight is their sum, push it back. The invariant of the greedy: the two cheapest fragments are always fused next.'],
                ['Read', 'After k−1 merges one root remains. Label every left edge 0 and every right edge 1; the codeword of a leaf is the bit string from root to leaf. Zero bits encode the single-symbol degenerate case.'],
              ].map(([h, b]) => (
                <li key={h} className="flex gap-4 border border-hair bg-surface p-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center border border-ink bg-ink font-mono text-[12px] text-paper">
                    {String(h)}
                  </span>
                  <p className="text-[14px] leading-relaxed text-ink2">{b}</p>
                </li>
              ))}
            </ol>
            <pre className="terminal overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.75] text-phosdim">{`function buildHuffman(freq : Map<sym, n>) -> root:
    heap = MinHeap()
    for (s, f) in freq.sortedBy(f, s):
        heap.push(Leaf(sym=s, w=f, id=nextId()))

    while heap.size > 1:
        lo = heap.pop()                // lightest
        hi = heap.pop()                // second lightest
        heap.push(Node(w=lo.w+hi.w,
                       left=lo, right=hi, id=nextId()))

    return heap.pop()

# prefix codes, root -> leaf
function assign(node, prefix=""):
    if node.isLeaf:  codes[node.sym] = prefix
    else:            assign(node.left,  prefix+"0")
                    assign(node.right, prefix+"1")`}</pre>
          </div>
        </section>

        {/* WHY IT WORKS */}
        <section>
          <div className="figlabel mb-4">
            <span className="fignum">M.3</span>
            <span className="figtitle">Why the greedy move is safe</span>
            <span className="flex-1" />
            <span className="fignum">■</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-hair bg-surface p-6">
              <p className="microlabel text-rust">Greedy-choice property</p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink2">
                In some optimal prefix code, the two least-frequent symbols sit at the bottom of
                the tree as siblings. <em>Exchange argument:</em> take any optimal tree — its
                two deepest leaves (which exist in every tree) can be swapped for our two rarest
                symbols without raising the cost, because the surface cost inequality{' '}
                <span className="font-mono">f(x)·d + f(y)·d ≥ f(x)·d&#8242; + f(y)·d&#8242;</span>{' '}
                holds when x, y are the lightest. Merging them is therefore always extendable to
                an optimum.
              </p>
            </div>
            <div className="border border-hair bg-surface p-6">
              <p className="microlabel text-rust">Optimal substructure</p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink2">
                After two leaves are replaced by one internal node of their summed weight, the
                rest of the code is optimal <em>for the reduced alphabet</em>. If a cheaper code
                existed there, splicing it back would beat the original tree&apos;s cost —
                contradiction. Hence the greedy choice and the subproblem are both safe, and
                induction over merges proves the whole tree optimal.
              </p>
            </div>
            <div className="border border-hair bg-surface p-6">
              <p className="microlabel text-rust">The entropy window</p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink2">
                Information theory fixes the floor H(S) = −Σ p·log&#8322;p. Huffman&apos;s average
                length satisfies <span className="font-mono">H(S) ≤ L̄ &lt; H(S)+1</span>: within
                one bit of the theoretical optimum per symbol, no matter the distribution. That
                residual is the price of integer-length codewords.
              </p>
            </div>
            <div className="border border-hair bg-surface p-6">
              <p className="microlabel text-rust">Kraft–McMillan test</p>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink2">
                A code {`{ℓᵢ}`} is prefix-free exactly when{' '}
                <span className="font-mono">Σ 2^(−ℓᵢ) ≤ 1</span>, with equality for full trees.
                Every construction this project ships validates to{' '}
                <span className="font-mono">Σ 2^(−ℓᵢ) = 1</span> — the workbench shows the running
                sum on every input.
              </p>
            </div>
          </div>
        </section>

        {/* COMPLEXITY */}
        <section>
          <div className="figlabel mb-4">
            <span className="fignum">M.4</span>
            <span className="figtitle">Cost accounting</span>
            <span className="flex-1" />
            <span className="fignum">■</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="overflow-x-auto border border-hair bg-surface">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Phase</th>
                    <th>Cost</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Frequency tally</td>
                    <td className="num-r">O(n)</td>
                    <td className="text-mute">one pass, hash map over symbols</td>
                  </tr>
                  <tr>
                    <td>Build tree</td>
                    <td className="num-r">O(k log k)</td>
                    <td className="text-mute">k−1 merges × O(log k) heap admission</td>
                  </tr>
                  <tr>
                    <td>Assign codes</td>
                    <td className="num-r">O(k log k)</td>
                    <td className="text-mute">tree walk, code depth &le; height</td>
                  </tr>
                  <tr>
                    <td>Encode</td>
                    <td className="num-r">O(n)</td>
                    <td className="text-mute">one code lookup per symbol</td>
                  </tr>
                  <tr>
                    <td>Decode</td>
                    <td className="num-r">O(n·h)</td>
                    <td className="text-mute">bit walk root→leaf, h = tree height</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="callout self-start">
              <p className="callout-title">Space on disk</p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ink2">
                The compressed file must ship whatever the decoder cannot infer: the stored
                frequency table (Σ: set of (codepoint, frequency) pairs), the payload length,
                and the padding count. The tree itself is never shipped — the decoder replays
                the deterministic merge order on the same frequencies and recovers the identical
                tree.
              </p>
            </div>
          </div>
        </section>

        {/* FORMAT */}
        <section>
          <div className="figlabel mb-4">
            <span className="fignum">M.5</span>
            <span className="figtitle">The HUF1 container</span>
            <span className="flex-1" />
            <span className="fignum">■</span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            <pre className="terminal self-start overflow-x-auto p-5 font-mono text-[12.5px] leading-[1.7] text-phosdim">{`HUF1  (all integers big-endian)
+--------+--------------------------------+
| marker |  4 bytes  "HUF1"               |
+--------+--------------------------------+
| codes  |  u16   number of symbols       |
+--------+--------------------------------+
| table  |  codes x {u32 codepoint,       |
|        |           u32 frequency}        |
+--------+--------------------------------+
| bits   |  u32   payload length in bits  |
+--------+--------------------------------+
| pad    |  u8    trailing 0-bits (0..7)  |
+--------+--------------------------------+
| payload|  ceil(bits/8) packed bytes     |
+--------+--------------------------------+`}</pre>
            <div className="space-y-4">
              <p className="prose-p text-[0.99rem] leading-relaxed text-ink2">
                The workbench emits and accepts exactly this container. The round-trip is the
                project&apos;s decompressor: an uploaded <span className="font-mono">.huf</span>{' '}
                file is marker-checked, its table parsed, the tree rebuilt from frequencies, and
                the payload walked root-to-leaf back into text. Frequencies cost ~5 extra bytes
                per symbol versus shipping canonical lengths, but they buy a decisive property for
                a teachable tool: the tree you visualise is byte-for-byte the tree that decodes.
              </p>
              <p className="prose-p text-[0.99rem] leading-relaxed text-ink2">
                Padding is explicit — a payload of, say, 20 bits occupies 3 bytes with 4 zero
                bits appended; the decoder trims by the <span className="font-mono">pad</span>{' '}
                field before walking. The report charges the header honestly so the ledger never
                flatters the method.
              </p>
            </div>
          </div>
        </section>

        {/* WHERE IT BREAKS */}
        <section className="grid gap-6 lg:grid-cols-3">
          <div className="border border-hair bg-surface p-6">
            <p className="microlabel text-rust">Near-uniform alphabets</p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink2">
              When every p(𝓈) ≈ 1/|Σ|, every codeword lands on the same length and Huffman
              degenerates to fixed-width — plus a header. Savings vanish; the method has
              nothing to exploit.
            </p>
          </div>
          <div className="border border-hair bg-surface p-6">
            <p className="microlabel text-rust">Order-blindness</p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink2">
              Huffman prices frequencies only; it ignores context, repetition and runs. A file of
              {` "ababab…"`} compresses nothing further once its two symbols are handled — LZ-style
              matching is required for that, which is exactly what DEFLATE layers on top.
            </p>
          </div>
          <div className="border border-hair bg-surface p-6">
            <p className="microlabel text-rust">One-byte overhead</p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink2">
              Integer code lengths cost up to one bit per symbol above entropy. Arithmetic
              coding removes even that — at the price of much more machinery. Huffman is the
              80/20: within a bit of the floor, with trivial decode.
            </p>
          </div>
        </section>

        {/* REAL WORLD */}
        <section>
          <div className="figlabel mb-4">
            <span className="fignum">M.6</span>
            <span className="figtitle">Where it actually ships</span>
            <span className="flex-1" />
            <span className="fignum">■</span>
          </div>
          <div className="prose-p space-y-4 text-[0.99rem] text-ink2">
            <p>
              DEFLATE — the engine inside <span className="font-mono">gzip</span>,{' '}
              <span className="font-mono">zip</span> and <span className="font-mono">png</span> —
              is a two-stage greedy: an LZ77 sliding window chases back-references (exploiting
              <em>order</em>), and a Huffman pass (exploiting <em>frequency</em>) prices the
              remaining symbols. JPEG sends its DCT coefficients through Huffman tables
              prescribed per image; MP3&apos;s Huffman pass finishes every bit-budget. The tree a
              student welds in a lab on a paragraph is, codeword for codeword, the tree packing
              archives seven decades later.
            </p>
            <p>
              Reference: D. A. Huffman, <em>“A Method for the Construction of Minimum-Redundancy
              Codes,”</em> Proc. IRE 40(9), 1952; treatises in CLRS §16.3 and Sedgewick,{' '}
              <em>Algorithms</em> §5.5.
            </p>
          </div>
        </section>
      </article>
    </>
  )
}