import { useEffect, useState } from 'react'
import { runScheduling } from '../simulation/scheduling'
import { computeMetrics } from '../simulation/scheduling/metrics'

// A live strip for the home page: the real Round Robin scheduler from the simulator, played one time unit at a time.
const PROCESSES = [
  { id: 'P1', arrival: 0, burst: 4, priority: 1 },
  { id: 'P2', arrival: 0, burst: 6, priority: 1 },
  { id: 'P3', arrival: 0, burst: 3, priority: 1 },
  { id: 'P4', arrival: 0, burst: 5, priority: 1 },
  { id: 'P5', arrival: 0, burst: 4, priority: 1 },
]
const QUANTUM = 2
const COLORS = { P1: '#6dffb0', P2: '#ffb454', P3: '#ff7f9a', P4: '#7cc4ff', P5: '#b4a7ff' }
const TICK_MS = 420

// computed once: the schedule never changes
const STEPS = runScheduling(PROCESSES, 'Round Robin', QUANTUM).filter((s) => s.running)
const METRICS = computeMetrics(runScheduling(PROCESSES, 'Round Robin', QUANTUM), PROCESSES)

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export default function HeroGantt() {
  const [still] = useState(prefersReducedMotion)
  const [now, setNow] = useState(still ? STEPS.length - 1 : 0)

  useEffect(() => {
    if (still) return undefined
    const id = setInterval(() => {
      if (document.hidden) return
      setNow((n) => (n + 1 >= STEPS.length + 3 ? 0 : n + 1)) // a short pause at the end, then it starts over
    }, TICK_MS)
    return () => clearInterval(id)
  }, [still])

  const at = Math.min(now, STEPS.length - 1)
  const current = STEPS[at]
  let switches = 0
  for (let i = 1; i <= at; i++) if (STEPS[i].running !== STEPS[i - 1].running) switches++
  const finished = now >= STEPS.length

  return (
    <div className="font-mono max-w-2xl" aria-label="Live demo: Round Robin scheduler running five processes" role="img">
      <div className="flex items-center justify-between text-[11px] text-os-muted mb-1.5">
        <span>$ round-robin --quantum {QUANTUM} --procs {PROCESSES.length}</span>
        <span className="text-cyan-400">{finished ? 'done ✓' : `cpu → ${current.running}`}</span>
      </div>
      <div className="flex gap-[3px]">
        {STEPS.map((s, i) => {
          const done = i <= now
          const isNow = i === now
          return (
            <div
              key={i}
              className="flex-1 h-8 min-w-0 overflow-hidden rounded-[4px] border text-[0px] sm:text-[10px] flex items-center justify-center font-bold transition-all duration-200"
              style={{
                background: done ? COLORS[s.running] : 'transparent',
                borderColor: done ? COLORS[s.running] : '#1c3226',
                color: done ? '#060a08' : 'transparent',
                boxShadow: isNow && !finished ? `0 0 14px ${COLORS[s.running]}99` : 'none',
                transform: isNow && !finished ? 'translateY(-2px)' : 'none',
              }}
            >
              {s.running.replace('P', '')}
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[11px] text-os-muted">
        <span>t = <span className="text-white">{current.time}</span></span>
        <span>context switches = <span className="text-white">{switches}</span></span>
        <span>avg waiting = <span className="text-white">{METRICS.avgWaiting.toFixed(1)}</span></span>
        <span>avg turnaround = <span className="text-white">{METRICS.avgTurnaround.toFixed(1)}</span></span>
      </div>
    </div>
  )
}
