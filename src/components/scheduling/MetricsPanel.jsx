import { motion } from 'framer-motion'

function computeMetrics(steps, processes) {
  if (!steps.length || !processes.length) return null

  const completions = steps.filter(s => s.completed)
  if (!completions.length) return null

  const waitingTimes = completions.map(s => s.waiting ?? 0)
  const turnaroundTimes = completions.map(s => s.turnaround ?? 0)

  const totalTime = steps[steps.length - 1].time + 1
  const busyTime = steps.filter(s => s.running !== null).length
  const cpuUtil = ((busyTime / totalTime) * 100).toFixed(1)

  const avgWaiting = (waitingTimes.reduce((a, b) => a + b, 0) / waitingTimes.length).toFixed(2)
  const avgTurnaround = (turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length).toFixed(2)
  const throughput = (completions.length / totalTime).toFixed(3)
  const avgResponse = avgWaiting // for non-preemptive = waiting time

  return { avgWaiting, avgTurnaround, cpuUtil, throughput, avgResponse, totalTime, completions: completions.length }
}

export default function MetricsPanel({ steps, processes }) {
  const m = computeMetrics(steps, processes)
  if (!m) return null

  const metrics = [
    { label: 'Avg Waiting Time', value: `${m.avgWaiting} units`, color: 'text-amber-400', desc: 'Time spent in ready queue' },
    { label: 'Avg Turnaround Time', value: `${m.avgTurnaround} units`, color: 'text-cyan-400', desc: 'Total time from arrival to finish' },
    { label: 'CPU Utilization', value: `${m.cpuUtil}%`, color: 'text-emerald-400', desc: 'Fraction of time CPU was busy' },
    { label: 'Throughput', value: `${m.throughput} proc/unit`, color: 'text-rose-400', desc: 'Processes completed per time unit' },
    { label: 'Avg Response Time', value: `${m.avgResponse} units`, color: 'text-blue-400', desc: 'Time from arrival to first run' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3"
    >
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Performance Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map(({ label, value, color, desc }) => (
          <div key={label} className="bg-os-bg border border-os-border rounded-lg p-3 space-y-1">
            <div className={`text-base font-bold font-mono ${color}`}>{value}</div>
            <div className="text-xs text-white font-medium">{label}</div>
            <div className="text-[10px] text-gray-500 leading-tight">{desc}</div>
          </div>
        ))}
      </div>

      {/* Per-process breakdown */}
      <div>
        <div className="text-xs text-gray-500 mb-2">Per-Process Breakdown</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-os-border text-gray-500">
              <th className="pb-1 text-left">PID</th>
              <th className="pb-1 text-left">Waiting</th>
              <th className="pb-1 text-left">Turnaround</th>
            </tr>
          </thead>
          <tbody>
            {steps.filter(s => s.completed).map((s, i) => (
              <tr key={i} className="border-b border-os-border/30">
                <td className="py-1 font-mono text-gray-300">{s.completed}</td>
                <td className="py-1 text-amber-400">{s.waiting}</td>
                <td className="py-1 text-cyan-400">{s.turnaround}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

