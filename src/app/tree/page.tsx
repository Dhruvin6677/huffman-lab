import TreeView from '@/components/tree/TreeView'
import { PageHead } from '@/components/ui'

export default function TreePage() {
  return (
    <>
      <PageHead
        idx="02"
        kicker="Visualiser"
        title={<>Huffman tree visualizer</>}
        lede="Every input owns a tree: each leaf is a symbol, each internal node the weight of its two fused children. Replay the construction merge by merge, watch the min-heap admit each new fragment, and trace any symbol to its exact codeword."
        meta={[
          { k: 'Greedy choice', v: 'always merge the two lightest' },
          { k: 'Invariant', v: 'leaf weight ≤ depth balance' },
          { k: 'Build cost', v: 'O(k log k) with a heap' },
          { k: 'Decode rule', v: '0 → left · 1 → right' },
        ]}
      />
      <TreeView />
    </>
  )
}