import { motion } from 'framer-motion'

export default function TLBCache({ step }) {
  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">TLB</h3>
        {step && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            step.tlbHit
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/20 text-rose-300'
          }`}>
            {step.tlbHit ? 'HIT' : 'MISS'}
          </span>
        )}
      </div>

      {!step ? (
        <p className="text-sm text-gray-500">Run simulation to see TLB.</p>
      ) : step.tlb.length === 0 ? (
        <p className="text-sm text-gray-600">Empty</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-os-border">
              <th className="pb-1 text-left">Page</th>
              <th className="pb-1 text-left">Frame</th>
            </tr>
          </thead>
          <tbody>
            {step.tlb.map((entry, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`border-b border-os-border/40 ${entry.page === step.page ? 'bg-amber-500/10' : ''}`}
              >
                <td className="py-1 font-mono text-gray-300">{entry.page}</td>
                <td className="py-1 font-mono text-gray-300">{entry.frame}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
