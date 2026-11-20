import { motion } from 'framer-motion'

export default function MemoryGrid({ step, frameCount }) {
  const frames = Array.from({ length: frameCount }, (_, i) => ({
    frame: i,
    page: step?.memory?.[i] ?? null,
    isNew: step?.event === 'fault' && step?.memory?.[i] === step?.page && i === (step?.memory?.indexOf(step?.page)),
  }))

  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Physical Memory</h3>
      {frames.map(({ frame, page, isNew }) => (
        <motion.div
          key={frame}
          animate={isNew ? { backgroundColor: 'rgba(79,227,184,0.15)' } : {}}
          transition={{ duration: 0.3 }}
          className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
            page !== null
              ? isNew
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : 'border-cyan-500/30 bg-cyan-500/10'
              : 'border-os-border bg-os-bg'
          }`}
        >
          <span className="text-xs text-gray-500">Frame {frame}</span>
          <span className={`text-sm font-mono font-semibold ${page !== null ? 'text-white' : 'text-gray-600'}`}>
            {page !== null ? `Page ${page}` : 'Empty'}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

