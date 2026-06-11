import { motion, AnimatePresence } from 'framer-motion'

export default function ProcessTable({ processes, step }) {
  if (!processes.length) return null

  return (
    <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-os-border text-xs text-gray-500 uppercase tracking-widest">
            <th className="px-4 py-2 text-left">PID</th>
            <th className="px-4 py-2 text-left">Arrival</th>
            <th className="px-4 py-2 text-left">Burst</th>
            <th className="px-4 py-2 text-left">Priority</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {processes.map(p => {
              const isRunning = step?.running === p.id
              const isReady = step?.queue?.includes(p.id)
              return (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border-b border-os-border/50 transition-colors ${isRunning ? 'bg-cyan-500/10' : ''}`}
                >
                  <td className="px-4 py-2 font-mono text-white">{p.id}</td>
                  <td className="px-4 py-2 text-gray-300">{p.arrival}</td>
                  <td className="px-4 py-2 text-gray-300">{p.burst}</td>
                  <td className="px-4 py-2 text-gray-300">{p.priority}</td>
                  <td className="px-4 py-2">
                    {isRunning ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">Running</span>
                    ) : isReady ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">Ready</span>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}

