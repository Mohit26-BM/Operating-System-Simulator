import { motion } from 'framer-motion'
import { buildGantt } from '../../simulation/scheduling/metrics'

// Eight clearly different hues from the Terminal palette (all bright enough for dark text)
const COLORS = [
  'bg-cyan-400', 'bg-amber-400', 'bg-rose-400', 'bg-blue-400',
  'bg-purple-400', 'bg-lime-400', 'bg-orange-400', 'bg-teal-400',
]

function colorFor(pid) {
  const n = parseInt(String(pid ?? '').replace(/\D/g, ''), 10)
  return COLORS[(Number.isFinite(n) ? n : 0) % COLORS.length]
}

// One cell per CPU time unit. Steps that are not CPU time (a process finishing, being re-queued)
// do not get a cell, so the chart shows only what the CPU actually did.
export default function GanttChart({ steps, currentStep }) {
  if (!steps.length) return null
  const cells = buildGantt(steps, currentStep)
  const last = steps[currentStep]
  const endTime = cells.length ? cells[cells.length - 1].time + cells[cells.length - 1].span : 0

  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Gantt Chart</h3>

      <div className="flex flex-wrap gap-1">
        {cells.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: c.stepIndex === currentStep ? 1.1 : 1 }}
            transition={{ duration: 0.15 }}
            style={c.span > 1 ? { width: '5.5rem' } : undefined}
            className={`${c.span > 1 ? '' : 'w-11'} h-11 rounded-lg flex items-center justify-center text-xs font-bold text-os-bg
              ${c.pid ? colorFor(c.pid) : 'bg-gray-700'}
              ${c.stepIndex === currentStep ? 'ring-2 ring-white ring-offset-2 ring-offset-os-surface' : ''}`}
            title={c.pid ?? `Idle for ${c.span} unit(s)`}
          >
            {c.pid ?? (c.span > 1 ? `idle ×${c.span}` : '—')}
          </motion.div>
        ))}
      </div>

      {/* Time labels: each cell starts at its label; the final label is the end time */}
      <div className="flex flex-wrap gap-1">
        {cells.map((c, i) => (
          <span key={i} style={c.span > 1 ? { width: '5.5rem' } : undefined} className={`${c.span > 1 ? '' : 'w-11'} text-center text-[10px] text-gray-500`}>{c.time}</span>
        ))}
        {cells.length > 0 && <span className="w-11 text-center text-[10px] text-gray-500">{endTime}</span>}
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
