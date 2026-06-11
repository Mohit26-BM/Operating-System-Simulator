import { motion } from 'framer-motion'

const COLORS = [
  'bg-indigo-500', 'bg-amber-500', 'bg-emerald-500',
  'bg-rose-500', 'bg-blue-500', 'bg-purple-500',
]

function colorFor(pid) {
  return COLORS[parseInt(pid?.slice(1) ?? 0) % COLORS.length]
}

export default function GanttChart({ steps, currentStep }) {
  if (!steps.length) return null
  const visible = steps.slice(0, currentStep + 1)
  const last = visible[visible.length - 1]

  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gantt Chart</h3>

      <div className="flex flex-wrap gap-1">
        {visible.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: i === currentStep ? 1.1 : 1 }}
            transition={{ duration: 0.15 }}
            className={`w-11 h-11 rounded-lg flex items-center justify-center text-xs font-bold text-white
              ${s.running ? colorFor(s.running) : 'bg-gray-700'}
              ${i === currentStep ? 'ring-2 ring-white ring-offset-1 ring-offset-os-surface' : ''}`}
            title={s.running ?? 'Idle'}
          >
            {s.running ?? '—'}
          </motion.div>
        ))}
      </div>

      {/* Time labels */}
      <div className="flex flex-wrap gap-1">
        {visible.map((s, i) => (
          <span key={i} className="w-11 text-center text-[10px] text-gray-500">{s.time}</span>
        ))}
        {visible.length > 0 && (
          <span className="w-11 text-center text-[10px] text-gray-500">{last.time + 1}</span>
        )}
      </div>

      {last?.completed && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-emerald-400 font-medium"
        >
          {last.completed} completed — Turnaround: {last.turnaround} | Waiting: {last.waiting}
        </motion.p>
      )}
    </div>
  )
}
