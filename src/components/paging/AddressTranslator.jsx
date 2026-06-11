import { motion } from 'framer-motion'

const STAGES = [
  { label: 'Page Requested', key: 'requested' },
  { label: 'TLB Lookup',     key: 'tlb' },
  { label: 'Page Table',     key: 'pageTable' },
  { label: 'Result',         key: 'result' },
]

function buildStages(step) {
  if (!step) return null
  return {
    requested:  { value: `Page ${step.page}`, status: 'done' },
    tlb:        { value: step.tlbHit ? 'HIT — frame found instantly' : 'MISS — checking page table', status: step.tlbHit ? 'hit' : 'miss' },
    pageTable:  { value: step.event === 'hit' ? `Page ${step.page} → ${step.physicalAddress}` : `Page fault! Loading page ${step.page}`, status: step.event },
    result:     {
      value: step.event === 'hit'
        ? step.physicalAddress
        : step.evicted !== null
          ? `Evicted Page ${step.evicted}, loaded Page ${step.page}`
          : `Loaded Page ${step.page} into free frame`,
      status: step.event,
    },
  }
}

const statusStyle = {
  done:  'border-cyan-500 bg-cyan-500/10',
  hit:   'border-emerald-500 bg-emerald-500/10',
  miss:  'border-amber-500  bg-amber-500/10',
  fault: 'border-rose-500   bg-rose-500/10',
}

const statusText = {
  done:  'text-cyan-300',
  hit:   'text-emerald-300',
  miss:  'text-amber-300',
  fault: 'text-rose-300',
}

export default function AddressTranslator({ step }) {
  const stages = buildStages(step)

  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Address Translation{step ? ` — Page ${step.page}` : ''}
      </h3>
      {!step ? (
        <p className="text-sm text-gray-500">Configure and run the simulation to watch virtual address translation step by step.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STAGES.map(({ label, key }, i) => {
            const s = stages[key]
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-lg border p-3 ${statusStyle[s.status]}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-full bg-cyan-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-400">{label}</span>
                </div>
                <p className={`text-sm font-medium ${statusText[s.status]}`}>{s.value}</p>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

