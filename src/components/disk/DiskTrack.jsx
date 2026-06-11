import { motion } from 'framer-motion'

export default function DiskTrack({ steps, currentStep, maxCylinder = 199 }) {
  if (!steps.length) return null

  const visible = steps.slice(0, currentStep + 1)
  const current = steps[currentStep]
  const pct = (v) => `${(v / maxCylinder) * 100}%`

  // collect all request positions for dots
  const allRequests = steps.length > 0
    ? [...new Set(steps.slice(1).map(s => s.target))]
    : []

  // build movement path from visible steps
  const path = visible
    .filter(s => s.from !== undefined)
    .map(s => ({ from: s.from, to: s.head }))

  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Disk Track</h3>
        {current?.total !== undefined && (
          <span className="text-xs text-gray-500">
            Total movement: <span className="text-white font-mono font-bold">{current.total}</span> cylinders
          </span>
        )}
      </div>

      {/* Track */}
      <div className="relative h-16 select-none">
        {/* Track bar */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-os-border -translate-y-1/2" />

        {/* Cylinder labels */}
        <div className="absolute -bottom-5 left-0 text-[10px] text-gray-600">0</div>
        <div className="absolute -bottom-5 right-0 text-[10px] text-gray-600">{maxCylinder}</div>

        {/* Movement lines */}
        {path.map((seg, i) => {
          const left = Math.min(seg.from, seg.to) / maxCylinder * 100
          const width = Math.abs(seg.from - seg.to) / maxCylinder * 100
          const isJump = steps[i + 1]?.direction === 'jump'
          return (
            <motion.div
              key={i}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${left}%`,
                width: `${width}%`,
                height: '2px',
                transformOrigin: seg.from < seg.to ? 'left' : 'right',
                marginTop: '-1px',
              }}
              className={isJump ? 'bg-amber-500/40' : 'bg-cyan-400/60'}
            />
          )
        })}

        {/* Request dots */}
        {allRequests.map(r => {
          const isServiced = visible.some(s => s.target === r)
          return (
            <div
              key={r}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
              style={{ left: pct(r) }}
            >
              <div className={`w-2.5 h-2.5 rounded-full border-2 ${
                isServiced ? 'bg-indigo-500 border-cyan-400' : 'bg-os-bg border-gray-500'
              }`} />
              <span className="text-[9px] text-gray-500 mt-3">{r}</span>
            </div>
          )
        })}

        {/* Head marker */}
        <motion.div
          animate={{ left: pct(current?.head ?? steps[0]?.head ?? 0) }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
          style={{ left: pct(steps[0]?.head ?? 0) }}
        >
          <div className="w-4 h-4 rounded-full bg-rose-500 border-2 border-rose-300 shadow-lg shadow-rose-500/40" />
          <span className="text-[10px] text-rose-400 font-mono font-bold mt-1">{current?.head}</span>
        </motion.div>
      </div>

      {/* Movement sequence */}
      <div className="pt-6">
        <div className="text-xs text-gray-500 mb-2">Movement Sequence</div>
        <div className="flex flex-wrap items-center gap-1 font-mono text-sm">
          {visible.map((s, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className={`px-2 py-0.5 rounded ${
                i === currentStep ? 'bg-rose-500/20 text-rose-300 font-bold' :
                i === 0 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-os-border text-gray-400'
              }`}>{s.head}</span>
              {i < visible.length - 1 && <span className="text-gray-600">→</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

