'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  analyze,
  buildSteps,
  type Analysis,
  type ConstructionStep,
  type HuffNode,
} from '@/lib/huffman'
import { num, prettyChar, clamp01 } from '@/lib/format'
import { SymBadge, Fig } from '@/components/ui'

const LS_KEY = 'huffman-lab:text'
const DEFAULT = 'ABRACADABRA!'

const ROW_H = 48
const NODE_R = 11
const LEAF_W = 26
const LEAF_H = 22

interface LNode {
  node: HuffNode
  x: number
  y: number
  parent: LNode | null
  side: 'L' | 'R'
  leafIndex: number | null
  subLeaves: number
  pathEdge: string | null
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
}

interface LEdge {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  label: '0' | '1'
}

function buildLayout(root: HuffNode, colW: number) {
  const nodes = new Map<number, LNode>()
  const edges: LEdge[] = []
  let leafCounter = 0

  const visit = (
    node: HuffNode,
    depth: number,
    parent: LNode | null,
    side: 'L' | 'R'
  ): LNode => {
    const ln: LNode = {
      node,
      x: 0,
      y: depth * ROW_H,
      parent,
      side,
      leafIndex: null,
      subLeaves: 0,
      pathEdge: parent ? `e-${parent.node.id}-${node.id}` : null,
      bbox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
    }
    if (node.left && node.right) {
      const l = visit(node.left, depth + 1, ln, 'L')
      const r = visit(node.right, depth + 1, ln, 'R')
      ln.x = (l.x + r.x) / 2
      ln.subLeaves = l.subLeaves + r.subLeaves
      ln.bbox = union(
        span(ln.x - NODE_R, ln.y - NODE_R, ln.x + NODE_R, ln.y + NODE_R),
        union(l.bbox, r.bbox)
      )
      edges.push({ id: `e-${node.id}-${node.left.id}`, x1: 0, y1: 0, x2: 0, y2: 0, label: '0' })
      edges.push({ id: `e-${node.id}-${node.right.id}`, x1: 0, y1: 0, x2: 0, y2: 0, label: '1' })
    } else {
      ln.leafIndex = leafCounter++
      ln.subLeaves = 1
      ln.x = ln.leafIndex * colW
      ln.bbox = span(ln.x - LEAF_W / 2 - 4, ln.y - LEAF_H / 2 - 10, ln.x + LEAF_W / 2 + 4, ln.y + LEAF_H / 2 + 10)
    }
    nodes.set(node.id, ln)
    return ln
  }

  const rootNode = visit(root, 0, null, 'L')

  for (const e of edges) {
    const from = nodes.get(fromId(e.id))!
    const to = nodes.get(toId(e.id))!
    e.x1 = from.x
    e.y1 = from.y
    e.x2 = to.x
    e.y2 = to.y
  }

  return { nodes, edges, root: rootNode }
}

function span(minX: number, minY: number, maxX: number, maxY: number) {
  return { minX, minY, maxX, maxY }
}
function union(a: { minX: number; minY: number; maxX: number; maxY: number }, b: { minX: number; minY: number; maxX: number; maxY: number }) {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }
}
function fromId(eid: string): number {
  return Number(eid.split('-')[1])
}
function toId(eid: string): number {
  return Number(eid.split('-')[2])
}

function collectIds(rootId: number, nodes: Map<number, LNode>): Set<number> {
  const out = new Set<number>()
  const root = nodes.get(rootId)
  if (!root) return out
  const walk = (n: LNode) => {
    out.add(n.node.id)
    if (n.node.left && n.node.right) {
      const l = nodes.get(n.node.left.id)
      const r = nodes.get(n.node.right.id)
      if (l) walk(l)
      if (r) walk(r)
    }
  }
  walk(root)
  return out
}

function pathEdgesOf(id: number, nodes: Map<number, LNode>): Set<string> {
  const s = new Set<string>()
  let n: LNode | null = nodes.get(id) ?? null
  while (n && n.pathEdge) {
    s.add(n.pathEdge)
    n = n.parent
  }
  return s
}

function charFreqOf(s: string): Map<string, number> {
  const m = new Map<string, number>()
  for (const cc of s) m.set(cc, (m.get(cc) ?? 0) + 1)
  return m
}

export default function TreeView() {
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [hoverId, setHoverId] = useState<number | null>(null)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [transform, setTransform] = useState({ x: 60, y: 40, k: 1 })
  const svgRef = useRef<SVGSVGElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (loaded) return
    const saved = localStorage.getItem(LS_KEY)
    const t = setTimeout(() => {
      setText(saved && saved.trim() ? saved.slice(0, 120000) : DEFAULT)
      setLoaded(true)
    }, 0)
    return () => clearTimeout(t)
  }, [loaded])

  const analysis = useMemo<Analysis | null>(() => (text.trim() ? analyze(text) : null), [text])
  const steps = useMemo<ConstructionStep[]>(
    () => (text.trim() ? buildSteps(charFreqOf(text)) : []),
    [text]
  )

  // auto-fit the tree when input changes
  useEffect(() => {
    if (!analysis) return
    const k = analysis.distinct
    const colW = k > 96 ? 12 : k > 48 ? 18 : k > 20 ? 26 : 34
    const totalW = Math.max(2, k - 1) * colW + 120
    const totalH = (analysis.maxLen + 1) * ROW_H + 80
    const svg = svgRef.current
    const vw = svg?.clientWidth || 980
    const vh = svg?.clientHeight || 540
    const scale = clamp01(Math.min(vw / totalW, vh / totalH, 1.15))
    const centered = Math.max(0, (vw - totalW * scale) / 2)
    setTransform({ x: 40 + centered, y: 30, k: Math.max(0.15, scale) })
  }, [analysis])

  const play = useCallback(() => {
    setPlaying((p) => {
      if (p) {
        if (timerRef.current) clearInterval(timerRef.current)
        return false
      }
      timerRef.current = setInterval(() => {
        setStep((s) => {
          const next = s + 1
          if (next > steps.length) {
            if (timerRef.current) clearInterval(timerRef.current)
            setPlaying(false)
            return steps.length
          }
          return next
        })
      }, 950 / speed)
      return true
    })
  }, [steps.length, speed])

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  if (!analysis) {
    return (
      <div className="wrap mt-10">
        <div className="terminal px-5 py-4 font-mono text-[13px] text-phosdim">
          <strong>huf$</strong> nothing to draw — paste some text above.
        </div>
      </div>
    )
  }

  const k = analysis.distinct
  const colW = k > 96 ? 12 : k > 48 ? 18 : k > 20 ? 26 : 34

  return (
    <>
      {/* controls */}
      <div className="wrap">
        <div className="panel overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair bg-paper px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  const saved = localStorage.getItem(LS_KEY)
                  setText(saved && saved.trim() ? saved.slice(0, 120000) : DEFAULT)
                  setStep(0)
                }}
              >
                ⟳ sync from workbench
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setText(DEFAULT)
                  setStep(0)
                }}
              >
                reset sample
              </button>
            </div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-mute">
              drag to pan · Ctrl+scroll to zoom · hover to read a code
            </p>
          </div>
          <div className="fieldzone px-4 py-2">
            <textarea
              className="field min-h-[64px] px-1 py-2"
              value={text}
              spellCheck={false}
              onChange={(e) => setText(e.target.value)}
              placeholder="paste the input whose Huffman tree you want to see…"
            />
          </div>
        </div>
      </div>

      {/* canvas + inspector */}
      <div className="wrap mt-8 grid gap-6 lg:grid-cols-[1fr_264px]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-hair bg-paper px-4 py-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink2">
              {k} leaves · up to {analysis.maxLen} deep · H(S) = {analysis.entropy.toFixed(2)} bit
            </p>
            <p className="font-mono text-[10.5px] text-faint">{num(analysis.n)} symbols</p>
          </div>
          <div className="dotgrid relative h-[560px] overflow-hidden">
            <svg
              ref={svgRef}
              className="h-full w-full cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'pan-y' }}
              onWheel={(e) => {
                if (!e.ctrlKey && !e.metaKey) return
                e.preventDefault()
                const r = svgRef.current?.getBoundingClientRect()
                if (!r) return
                const px = e.clientX - r.left
                const py = e.clientY - r.top
                setTransform((t) => {
                  const nk = clamp01(t.k * (e.deltaY < 0 ? 1.16 : 1 / 1.16))
                  const wx = (px - t.x) / t.k
                  const wy = (py - t.y) / t.k
                  return { k: nk, x: px - wx * nk, y: py - wy * nk }
                })
              }}
              onPointerDown={(e) => {
                const svg = svgRef.current!
                svg.setPointerCapture(e.pointerId)
                const start = { x: e.clientX, y: e.clientY, t: transform }
                const move = (ev: PointerEvent) => {
                  setTransform({ ...start.t, x: start.t.x + (ev.clientX - start.x), y: start.t.y + (ev.clientY - start.y) })
                }
                const up = () => {
                  svg.removeEventListener('pointermove', move)
                  svg.removeEventListener('pointerup', up)
                  svg.removeEventListener('pointercancel', up)
                }
                svg.addEventListener('pointermove', move)
                svg.addEventListener('pointerup', up)
                svg.addEventListener('pointercancel', up)
              }}
            >
              <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
                <TreeCanvas
                  analysis={analysis}
                  steps={steps}
                  step={step}
                  colW={colW}
                  hoverId={hoverId}
                  onHover={setHoverId}
                />
              </g>
            </svg>
          </div>
        </div>

        <Inspector hoverId={hoverId} analysis={analysis} step={step} stepsCount={steps.length} />
      </div>

      {/* greedy replay */}
      <div className="wrap mt-12">
        <Fig num="06" title="Greedy construction · 0→left · 1→right">
          <GreedyReplay
            steps={steps}
            step={step}
            setStep={setStep}
            playing={playing}
            onPlay={play}
            speed={speed}
            setSpeed={setSpeed}
          />
        </Fig>
      </div>
    </>
  )
}

function TreeCanvas({
  analysis,
  steps,
  step,
  colW,
  hoverId,
  onHover,
}: {
  analysis: Analysis
  steps: ConstructionStep[]
  step: number
  colW: number
  hoverId: number | null
  onHover: (id: number | null) => void
}) {
  const { nodes, edges } = useMemo(() => buildLayout(analysis.root, colW), [analysis.root, colW])
  const [stepRoots, stepIds] = useMemo(() => {
    if (steps.length === 0) return [null, new Set<number>()]
    if (step === 0) {
      const all = new Set<number>()
      for (const f of analysis.freqs) all.add(nodeIdForSym(f.sym, analysis))
      return [null, all]
    }
    if (step > steps.length) return [null, new Set<number>()]
    const s = steps[step - 1]
    return [s, new Set([...collectIds(s.leftId, nodes), ...collectIds(s.rightId, nodes)])]
  }, [steps, step, nodes, analysis])

  const hotPath = useMemo(() => pathEdgesOf(hoverId ?? -1, nodes), [hoverId, nodes])
  const anyHighlight = stepIds.size > 0 || hotPath.size > 0

  return (
    <g>
      {edges.map((e) => {
        const inPath = hotPath.has(e.id)
        const inStep = stepActive(e, stepRoots, nodes)
        return (
          <g key={e.id} opacity={anyHighlight && !inPath && !inStep ? 0.22 : 1} className="transition-opacity duration-150">
            <path
              d={`M ${e.x1} ${e.y1} C ${e.x1} ${e.y1 + ROW_H * 0.4}, ${e.x2} ${e.y2 - ROW_H * 0.4}, ${e.x2} ${e.y2}`}
              fill="none"
              stroke={inPath ? '#bf4a1f' : inStep ? '#2e7d43' : '#c9c0a8'}
              strokeWidth={inPath || inStep ? 2.6 : 1.3}
            />
            <text
              x={(e.x1 + e.x2) / 2}
              y={(e.y1 + e.y2) / 2}
              textAnchor="middle"
              fontSize={9.5}
              fontFamily="var(--font-plex)"
              fill={inPath || inStep ? '#bf4a1f' : '#a49c83'}
            >
              {e.label}
            </text>
          </g>
        )
      })}

      {[...nodes.values()].map((ln) => {
        const n = ln.node
        const isLeaf = ln.leafIndex !== null
        const hovered = hoverId === n.id
        const inStepSub = stepIds.has(n.id)
        const dimmed = anyHighlight && !hovered && !hotPath.has(ln.pathEdge ?? '') && !inStepSub
        const leafPulse = stepIds.has(n.id)
        return (
          <g
            key={n.id}
            opacity={dimmed ? 0.22 : 1}
            onMouseEnter={() => onHover(n.id)}
            onMouseLeave={() => onHover(null)}
            className="transition-opacity duration-150"
            style={{ cursor: 'pointer' }}
          >
            {isLeaf ? (
              <>
                <rect
                  x={ln.x - LEAF_W / 2}
                  y={ln.y - LEAF_H / 2}
                  width={LEAF_W}
                  height={LEAF_H}
                  rx={2}
                  fill={hovered ? '#f7e2d7' : 'transparent'}
                  stroke={hovered ? '#bf4a1f' : leafPulse ? '#2e7d43' : '#b7ad90'}
                  strokeWidth={hovered || leafPulse ? 2 : 1.2}
                />
                <text
                  x={ln.x}
                  y={ln.y + 5}
                  textAnchor="middle"
                  fontSize={13}
                  fontFamily="var(--font-plex)"
                  fontWeight={hovered ? 600 : 400}
                  fill="#1b180f"
                >
                  {prettyChar(n.sym!)}
                </text>
              </>
            ) : (
              <>
                <circle
                  cx={ln.x}
                  cy={ln.y}
                  r={hovered ? NODE_R + 2.5 : NODE_R}
                  fill={hovered ? '#bf4a1f' : '#17140d'}
                  stroke={leafPulse ? '#2e7d43' : '#b7ad90'}
                  strokeWidth={hovered || leafPulse ? 2.4 : 1.2}
                  className={leafPulse ? 'pulse' : undefined}
                />
                <text
                  x={ln.x}
                  y={ln.y + 4}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontFamily="var(--font-plex)"
                  fill={hovered ? '#fff3e8' : '#ece6d6'}
                >
                  {n.weight}
                </text>
              </>
            )}
            {isLeaf && (
              <text
                x={ln.x}
                y={ln.y + LEAF_H / 2 + 12}
                textAnchor="middle"
                fontSize={9}
                fontFamily="var(--font-plex)"
                fill="#8a8470"
              >
                {n.weight}
              </text>
            )}
          </g>
        )
      })}

      {/* legend chip */}
      <g transform={`translate(10 10)`} className="pointer-events-none select-none">
        <circle cx={8} cy={8} r={6} fill="#17140d" stroke="#b7ad90" />
        <text x={20} y={11} fontSize={10} fontFamily="var(--font-plex)" fill="#6f684f">
          internal weight
        </text>
        <rect x={8} y={26} width={12} height={10} fill="transparent" stroke="#b7ad90" />
        <text x={26} y={35} fontSize={10} fontFamily="var(--font-plex)" fill="#6f684f">
          leaf symbol — weight under it
        </text>
      </g>
    </g>
  )

  function stepActive(e: LEdge, stepRoots: ConstructionStep | null, nodes: Map<number, LNode>): boolean {
    if (!stepRoots) return false
    const target = toId(e.id)
    const left = collectIds(stepRoots.leftId, nodes)
    const right = collectIds(stepRoots.rightId, nodes)
    return left.has(target) || right.has(target)
  }
}

function nodeIdForSym(sym: string, analysis: Analysis): number {
  const walk = (n: HuffNode): number | null => {
    if (n.sym === sym) return n.id
    if (n.left) {
      const l = walk(n.left)
      if (l !== null) return l
    }
    if (n.right) return walk(n.right)
    return null
  }
  return walk(analysis.root) ?? -1
}

function GreedyReplay({
  steps,
  step,
  setStep,
  playing,
  onPlay,
  speed,
  setSpeed,
}: {
  steps: ConstructionStep[]
  step: number
  setStep: (s: number) => void
  playing: boolean
  onPlay: () => void
  speed: number
  setSpeed: (n: number) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [step])

  if (steps.length === 0) {
    return (
      <div className="terminal px-5 py-4 font-mono text-[13px] text-phosdim">
        <strong>set:</strong> the alphabet is a single symbol — nothing to merge; its codeword is the empty
        string, costing 0 bits.
      </div>
    )
  }

  const shown = Math.min(step, steps.length)
  const heap = steps[shown === 0 ? 0 : shown - 1]?.heap ?? steps[0].heap

  return (
    <div className="border border-hair bg-surface">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-hair bg-paper px-5 py-3">
        <div className="flex items-center gap-2">
          <button type="button" className="btn btn-sm btn-rust" onClick={onPlay}>
            {playing ? '❚❚ pause' : '▶ play greedy'}
          </button>
          <span className="microlabel ml-2">speed</span>
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              type="button"
              data-on={speed === s}
              className="chip"
              onClick={() => setSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>
        <p className="font-mono text-[12px] text-ink2">
          merge <span className="text-rust">{shown}</span>/{steps.length}
          {shown >= steps.length ? ' · greedy terminates — 1 root remains' : ''}
        </p>
        <input
          type="range"
          className="scrub min-w-[200px] flex-1"
          min={0}
          max={steps.length}
          value={step}
          onChange={(e) => setStep(Number(e.target.value))}
          aria-label="construction step"
        />
      </div>

      <div className="grid md:grid-cols-[1fr_1.05fr]">
        <div ref={listRef} className="max-h-[300px] overflow-auto border-b border-hair md:border-b-0 md:border-r">
          {steps.map((s, i) => {
            const active = i === shown - 1
            return (
              <button
                key={s.index}
                type="button"
                data-active={active}
                onClick={() => setStep(i + 1)}
                className={`flex w-full items-baseline gap-3 border-b border-hair/60 px-5 py-2.5 text-left font-mono text-[12.5px] transition-colors ${
                  active ? 'bg-rustbg text-rustd' : 'text-ink2 hover:bg-paper'
                }`}
              >
                <span className="text-[10.5px] text-faint">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <StepSym s={s.leftSym} w={s.leftWeight} />
                  <span className="mx-1.5 text-faint">∪</span>
                  <StepSym s={s.rightSym} w={s.rightWeight} />
                  <span className="mx-1.5 text-faint">→</span>
                  <span className={active ? 'font-medium' : ''}>Σ{s.newWeight}</span>
                </span>
                <span className="ml-auto text-[10.5px] text-faint">
                  {s.leftWeight}+{s.rightWeight}
                </span>
              </button>
            )
          })}
        </div>

        <div className="p-5">
          <p className="microlabel">
            priority queue — min-heap after {shown} merge{shown === 1 ? '' : 's'}
          </p>
          <div className="mt-3 flex max-h-[220px] flex-wrap gap-2 overflow-auto">
            {heap.map((h, i) => (
              <span
                key={`${h.id}-${i}`}
                className={`border px-2 py-1.5 font-mono text-[12px] tabular-nums ${
                  i === 0 ? 'border-rust bg-rustbg text-rustd' : 'border-hair2 bg-paper text-ink2'
                }`}
              >
                {i === 0 && <span className="mr-1 text-[9px] uppercase tracking-wider text-rust">min </span>}
                {h.sym === null ? `Σ${h.weight}` : `${prettyChar(h.sym)}=${h.weight}`}
              </span>
            ))}
          </div>
          <p className="mt-4 font-mono text-[11.5px] leading-relaxed text-mute">
            The greedy invariant holds at every step: the two cheapest fragments
            are always merged next, and the heap admits the result in O(log k).
          </p>
        </div>
      </div>
    </div>
  )
}

function StepSym({ s, w }: { s: string | null; w: number }) {
  if (s === null) return <span className="text-ink2">Σ{w}</span>
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="grid h-[18px] w-[18px] place-items-center border border-hair2 bg-paper text-[10px] text-ink">
        {prettyChar(s)}
      </span>
      {w}
    </span>
  )
}

function Inspector({
  hoverId,
  analysis,
  step,
  stepsCount,
}: {
  hoverId: number | null
  analysis: Analysis
  step: number
  stepsCount: number
}) {
  if (hoverId === null) {
    return (
      <div className="panel flex flex-col gap-5 p-5 lg:sticky lg:top-20 lg:self-start">
        <P block>Node inspector</P>
        <p className="font-mono text-[12px] leading-relaxed text-mute">
          hover a node.
          <br />
          leaves carry a symbol; internal nodes carry the merged subtree weight.
        </p>
        <Guide />
        <ConstructionNote step={step} stepsCount={stepsCount} />
      </div>
    )
  }
  return (
    <div className="panel flex flex-col gap-5 p-5 lg:sticky lg:top-20 lg:self-start">
      <P block>Node inspector</P>
      <NodeInfo id={hoverId} analysis={analysis} />
      <Guide />
      <ConstructionNote step={step} stepsCount={stepsCount} />
    </div>
  )
}

function P({ block, children }: { block?: boolean; children: React.ReactNode }) {
  return block ? <p className="microlabel">{children}</p> : <p>{children}</p>
}

function Guide() {
  return (
    <div>
      <p className="microlabel">reading guide</p>
      <ul className="mt-3 space-y-2 font-mono text-[11.5px] text-ink2">
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border border-hair2" /> internal · merged weight
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-hair2" /> leaf · symbol
        </li>
        <li className="flex items-center gap-2">
          <span className="text-rust">0</span> → left branch
          <span className="ml-2 text-rust">1</span> → right branch
        </li>
      </ul>
    </div>
  )
}

function ConstructionNote({ step, stepsCount }: { step: number; stepsCount: number }) {
  return (
    <div className="border-t border-hair pt-4">
      <p className="microlabel">construction</p>
      <p className="mt-2 font-mono text-[12px] leading-relaxed text-mute">
        {stepsCount === 0
          ? 'no merges — single-symbol alphabet'
          : `${stepsCount} greedy merges · watching step ${Math.min(step, stepsCount)} of ${stepsCount}`}
      </p>
    </div>
  )
}

function NodeInfo({ id, analysis }: { id: number; analysis: Analysis }) {
  const info = useMemo(() => {
    const find = (n: HuffNode): { leaf: HuffNode | null; sym: string | null } => {
      if (n.id === id) {
        return { leaf: n.sym !== null ? n : null, sym: n.sym }
      }
      if (n.left) {
        const l = find(n.left)
        if (l.leaf) return l
      }
      if (n.right) return find(n.right)
      return { leaf: null, sym: null }
    }
    const r = find(analysis.root)
    return r
  }, [id, analysis])

  if (!info.leaf || info.sym === null) {
    return (
      <p className="font-mono text-[12px] leading-relaxed text-ink2">
        internal node — weight <span className="font-medium text-rust">{weightOf(analysis.root, id)}</span>
        <br />
        <span className="text-faint">the two subtrees under it were fused by the greedy rule</span>
      </p>
    )
  }

  const sym = info.sym
  const freq = info.leaf.weight
  const p = freq / analysis.n
  const code = analysis.codes.get(sym) ?? ''
  const depth = code.length
  const subLeaves = countLeaves(info.leaf)

  return (
    <div>
      <p className="flex items-center gap-2">
        <SymBadge sym={sym} />
      </p>
      <dl className="mt-3 space-y-1.5 font-mono text-[12px]">
        <div className="flex justify-between">
          <dt className="text-mute">frequency</dt>
          <dd>{num(freq)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-mute">probability</dt>
          <dd>{p.toFixed(4)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-mute">depth / length</dt>
          <dd>{depth} bit</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-mute">bits spent</dt>
          <dd>{num(freq * depth)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-mute">subtree leaves</dt>
          <dd>{subLeaves}</dd>
        </div>
      </dl>
      <p className="mt-3 rounded-[2px] bg-greenbg px-3 py-2 font-mono text-[16px] tracking-wide text-green">
        {code === '' ? 'ε' : code}
        <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-green/70">codeword</span>
      </p>
    </div>
  )
}

function weightOf(root: HuffNode, id: number): number {
  const walk = (n: HuffNode): number | null => {
    if (n.id === id) return n.weight
    if (n.left) {
      const l = walk(n.left)
      if (l !== null) return l
    }
    if (n.right) return walk(n.right)
    return null
  }
  return walk(root) ?? 0
}

function countLeaves(n: HuffNode): number {
  if (n.sym !== null) return 1
  return (n.left ? countLeaves(n.left) : 0) + (n.right ? countLeaves(n.right) : 0)
}