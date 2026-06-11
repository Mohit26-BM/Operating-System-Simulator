import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SimHelp from '../components/shared/SimHelp'
import { fifo } from '../simulation/paging/fifo'
import { lru }  from '../simulation/paging/lru'
import { optimal } from '../simulation/paging/optimal'

const HELP = {
  title: 'Page Replacement',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: 'Compares FIFO, LRU, and Optimal page replacement side-by-side for the same reference string and frame count — so you can see which algorithm causes fewer page faults.' }],
    },
    {
      heading: 'Setup',
      items: [
        { icon: '📝', label: 'Reference String', text: 'Space-separated page numbers, e.g. "7 0 1 2 0 3". Each number is one memory access.' },
        { icon: '🗂',  label: 'Frame Count',     text: 'Drag the slider (1–6). Fewer frames = more faults. Watch how each algorithm responds.' },
        { icon: '⚡',  label: 'Presets',         text: 'Classic textbook examples — click any to load immediately.' },
      ],
    },
    {
      heading: 'Algorithms',
      items: [
        { icon: '🔵', label: 'FIFO',    text: 'Evicts the page that has been in memory the longest. Simple but can suffer Bélády\'s anomaly.' },
        { icon: '🟢', label: 'LRU',     text: 'Evicts the least recently used page. Good approximation of Optimal in practice.' },
        { icon: '🟣', label: 'Optimal', text: 'Evicts the page needed furthest in the future. Theoretical best — impossible in practice without future knowledge.' },
      ],
    },
    {
      heading: 'Controls',
      items: [
        { icon: '▶', label: 'Play',   text: 'Auto-advances through all references. Each step shows the current page in all three algorithms simultaneously.' },
        { icon: '→', label: 'Next',   text: 'Step forward one reference at a time.' },
      ],
    },
  ],
}

const PRESETS = [
  { label: '7 0 1 2 0 3 0 4 2 3 0 3 2', ref: [7,0,1,2,0,3,0,4,2,3,0,3,2] },
  { label: '1 2 3 4 1 2 5 1 2 3 4 5',   ref: [1,2,3,4,1,2,5,1,2,3,4,5]   },
  { label: '2 3 2 1 5 2 4 5 3 2 5 2',   ref: [2,3,2,1,5,2,4,5,3,2,5,2]   },
]

const ALGO_COLORS = {
  FIFO:    { accent: '#06b6d4', bg: 'bg-cyan-500/10',   border: 'border-cyan-500/40',   text: 'text-cyan-400'   },
  LRU:     { accent: '#22c55e', bg: 'bg-green-500/10',  border: 'border-green-500/40',  text: 'text-green-400'  },
  Optimal: { accent: '#a78bfa', bg: 'bg-violet-500/10', border: 'border-violet-500/40', text: 'text-violet-400' },
}

function FrameGrid({ frames, frameCount, stepEvent, evicted, incoming }) {
  const slots = Array.from({ length: frameCount }, (_, i) => frames[i] ?? null)
  return (
    <div className="flex gap-2 justify-center py-2">
      {slots.map((page, i) => {
        const isNew     = page === incoming && stepEvent === 'fault' && i === frames.indexOf(incoming)
        const isEvicted = page === null && evicted !== null
        return (
          <motion.div
            key={i}
            animate={isNew ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center font-mono text-sm font-bold
              ${page === null
                ? 'border-os-border text-gray-700 bg-os-bg'
                : isNew
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                : 'border-os-border bg-os-surface text-white'}`}
          >
            {page ?? '—'}
          </motion.div>
        )
      })}
    </div>
  )
}

function AlgoColumn({ name, steps, cursor, frameCount }) {
  const c = ALGO_COLORS[name]
  const step = steps[cursor] ?? null
  const faults = steps.slice(0, cursor + 1).filter(s => s.event === 'fault').length
  const hits   = steps.slice(0, cursor + 1).filter(s => s.event === 'hit').length
  const total  = cursor + 1

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-4 flex flex-col gap-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`font-bold text-sm ${c.text}`}>{name}</span>
        <div className="flex gap-2 text-xs font-mono">
          <span className="text-green-400">{hits} hit</span>
          <span className="text-red-400">{faults} fault</span>
        </div>
      </div>

      {/* Frames */}
      {step && <FrameGrid frames={step.memory} frameCount={frameCount} stepEvent={step.event} evicted={step.evicted} incoming={step.page} />}

      {/* Hit/fault indicator */}
      <AnimatePresence mode="wait">
        {step && (
          <motion.div
            key={`${cursor}-${name}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-center py-1.5 rounded-lg text-xs font-mono font-bold
              ${step.event === 'hit'
                ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}
          >
            {step.event === 'hit' ? '✓ HIT' : `✗ PAGE FAULT${step.evicted != null ? ` — evicted ${step.evicted}` : ''}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fault rate bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-gray-600">
          <span>fault rate</span>
          <span>{total > 0 ? ((faults / total) * 100).toFixed(0) : 0}%</span>
        </div>
        <div className="h-1.5 bg-os-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-red-500"
            animate={{ width: `${total > 0 ? (faults / total) * 100 : 0}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  )
}

export default function PageReplacement() {
  const [refInput, setRefInput]     = useState('7 0 1 2 0 3 0 4 2 3 0 3 2')
  const [frameCount, setFrameCount] = useState(3)
  const [cursor, setCursor]         = useState(-1)
  const [playing, setPlaying]       = useState(false)
  const [intervalId, setIntervalId] = useState(null)

  const refString = useMemo(() => {
    return refInput.trim().split(/\s+/).map(Number).filter(n => !isNaN(n))
  }, [refInput])

  const { fifoSteps, lruSteps, optSteps } = useMemo(() => ({
    fifoSteps: fifo(refString, frameCount),
    lruSteps:  lru(refString, frameCount),
    optSteps:  optimal(refString, frameCount),
  }), [refString, frameCount])

  const maxStep = fifoSteps.length - 1

  function handlePlay() {
    if (cursor >= maxStep) { setCursor(0); return }
    setPlaying(true)
    const id = setInterval(() => {
      setCursor(prev => {
        if (prev >= maxStep) { clearInterval(id); setPlaying(false); return prev }
        return prev + 1
      })
    }, 800)
    setIntervalId(id)
  }

  function handlePause() {
    clearInterval(intervalId)
    setPlaying(false)
  }

  function handleReset() {
    clearInterval(intervalId)
    setPlaying(false)
    setCursor(-1)
  }

  function applyPreset(p) {
    handleReset()
    setRefInput(p.ref.join(' '))
  }

  const step = cursor >= 0 ? fifoSteps[cursor] : null

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Page Replacement</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Compare FIFO, LRU, and Optimal side-by-side for the same reference string.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Config */}
      <div className="bg-os-surface border border-os-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-mono uppercase tracking-widest">Reference String</label>
            <input
              value={refInput}
              onChange={e => { setRefInput(e.target.value); handleReset() }}
              placeholder="e.g. 7 0 1 2 0 3 0 4"
              className="w-full bg-os-bg border border-os-border rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-mono uppercase tracking-widest">Frame Count: {frameCount}</label>
            <input
              type="range" min={1} max={6} value={frameCount}
              onChange={e => { setFrameCount(+e.target.value); handleReset() }}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-600 font-mono self-center">Presets:</span>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="text-xs px-3 py-1 rounded-lg bg-os-bg border border-os-border text-gray-400 hover:text-white hover:border-cyan-500 transition-colors font-mono">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reference string tape */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4">
        <div className="text-xs text-gray-600 font-mono mb-2 uppercase tracking-widest">Reference String</div>
        <div className="flex gap-1.5 flex-wrap">
          {refString.map((p, i) => (
            <motion.div
              key={i}
              animate={i === cursor ? { scale: 1.2 } : { scale: 1 }}
              className={`w-8 h-8 rounded-lg border font-mono text-xs font-bold flex items-center justify-center
                ${i === cursor
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                  : i < cursor
                  ? 'border-os-border bg-os-surface text-gray-500'
                  : 'border-os-border bg-os-bg text-gray-600'}`}
            >
              {p}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Three-column comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cursor >= 0 && (
          <>
            <AlgoColumn name="FIFO"    steps={fifoSteps} cursor={cursor} frameCount={frameCount} />
            <AlgoColumn name="LRU"     steps={lruSteps}  cursor={cursor} frameCount={frameCount} />
            <AlgoColumn name="Optimal" steps={optSteps}  cursor={cursor} frameCount={frameCount} />
          </>
        )}
        {cursor < 0 && (
          <div className="col-span-3 text-center py-12 text-gray-600 font-mono text-sm">
            Press Play or Step → to start the comparison
          </div>
        )}
      </div>

      {/* Summary table — shown when complete */}
      {cursor === maxStep && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-os-surface border border-os-border rounded-xl p-5"
        >
          <div className="text-sm font-medium text-white mb-3">Final Comparison ({refString.length} references, {frameCount} frames)</div>
          <div className="grid grid-cols-3 gap-4 text-center text-sm font-mono">
            {[
              { name: 'FIFO',    steps: fifoSteps },
              { name: 'LRU',     steps: lruSteps  },
              { name: 'Optimal', steps: optSteps  },
            ].map(({ name, steps: s }) => {
              const faults = s.filter(x => x.event === 'fault').length
              const c = ALGO_COLORS[name]
              return (
                <div key={name} className={`rounded-lg border ${c.border} ${c.bg} p-3 space-y-1`}>
                  <div className={`font-bold ${c.text}`}>{name}</div>
                  <div className="text-red-400 text-lg font-bold">{faults}</div>
                  <div className="text-gray-600 text-xs">page faults</div>
                  <div className="text-gray-500 text-xs">{s.length - faults} hits</div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Optimal is the theoretical minimum — it uses future knowledge. In practice, LRU approximates it closely.
          </p>
        </motion.div>
      )}

      {/* Controls */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3">
        <div className="w-full h-1.5 bg-os-border rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 transition-all duration-300"
            style={{ width: `${maxStep >= 0 ? ((cursor + 1) / (maxStep + 1)) * 100 : 0}%` }}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleReset}
            className="px-3 py-1.5 text-sm rounded-lg bg-os-border text-gray-300 hover:text-white transition-colors">
            Reset
          </button>
          <button onClick={() => setCursor(c => Math.max(c - 1, -1))} disabled={cursor < 0}
            className="px-3 py-1.5 text-sm rounded-lg bg-os-border text-gray-300 hover:text-white disabled:opacity-30 transition-colors">
            ← Back
          </button>
          {playing ? (
            <button onClick={handlePause}
              className="px-4 py-1.5 text-sm rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition-colors font-medium">
              Pause
            </button>
          ) : (
            <button onClick={handlePlay} disabled={cursor >= maxStep}
              className="px-4 py-1.5 text-sm rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-30 transition-colors font-medium">
              ▶ Play
            </button>
          )}
          <button onClick={() => setCursor(c => Math.min(c + 1, maxStep))} disabled={cursor >= maxStep}
            className="px-3 py-1.5 text-sm rounded-lg bg-os-border text-gray-300 hover:text-white disabled:opacity-30 transition-colors">
            Next →
          </button>
          <span className="text-xs text-gray-500 ml-auto font-mono">
            {cursor >= 0 ? `Page ${cursor + 1} / ${refString.length}` : 'not started'}
          </span>
        </div>
      </div>
    </div>
  )
}
