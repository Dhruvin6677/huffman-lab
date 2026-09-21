import Report from '@/components/report/Report'
import { PageHead } from '@/components/ui'
import { CORPUS } from '@/lib/corpus'

export default function ReportPage() {
  return (
    <>
      <PageHead
        idx="03"
        kicker="Compression report"
        title={
          <>
            Six files,
            <br />
            one ledger.
          </>
        }
        lede="Fixed-width codes charge every symbol the same wage; Huffman charges what the source deserves. This report runs the real engine over a mixed corpus — prose, source, a marks table, a genome, JSON, and a deliberately uniform stream — and books each file honestly: payload plus the header the decoder needs."
        meta={[
          { k: 'Corpus', v: `${CORPUS.length} hand-picked files` },
          { k: 'Control', v: 'fixed-width ⌈log₂|Σ|⌉' },
          { k: 'Accounting', v: 'container, header included' },
          { k: 'Live', v: 'nothing hardcoded' },
        ]}
      />
      <Report />
    </>
  )
}