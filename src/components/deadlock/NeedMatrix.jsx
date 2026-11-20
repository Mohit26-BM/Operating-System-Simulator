import { motion } from 'framer-motion'

export default function NeedMatrix({ result, resources }) {
  if (!result?.need) return null

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Need Matrix (Max − Allocation)</h3>
      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-os-border">
              <th className="px-4 py-2 text-left text-xs text-gray-500">P</th>
              {Array.from({ length: resources }, (_, j) => (
                <th key={j} className="px-4 py-2 text-left text-xs text-gray-500">R{j}</th>
              ))}
              <th className="px-4 py-2 text-left text-xs text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {result.need.map((row, i) => {
              const inSequence = result.sequence?.includes(`P${i}`)
              return (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border-b border-os-border/40 ${inSequence ? 'bg-emerald-500/10' : 'bg-rose-500/5'}`}
                >
                  <td className="px-4 py-2 font-mono text-gray-300">P{i}</td>
                  {row.map((v, j) => (
                    <td key={j} className="px-4 py-2 font-mono text-gray-300">{v}</td>
                  ))}
                  <td className="px-4 py-2">
                    {inSequence ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                        Safe (pos {result.sequence.indexOf(`P${i}`) + 1})
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium">
                        Blocked
                      </span>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
