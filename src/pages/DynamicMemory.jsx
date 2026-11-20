import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import CodePanel from '../components/shared/CodePanel'
import Controls from '../components/shared/Controls'
import AIExplainer from '../components/shared/AIExplainer'
import SimHelp from '../components/shared/SimHelp'
import { usePlayer } from '../hooks/usePlayer'
import { parseInteger } from '../simulation/parse'
import { simulateDynamic, parseScript, STRATEGIES, DYNAMIC_CODE, DYNAMIC_ANNOTATIONS, MAX_MEMORY } from '../simulation/memory/dynamic'
import { simulateBuddy, BUDDY_CODE, BUDDY_ANNOTATIONS } from '../simulation/memory/buddy'

const ALL = [...STRATEGIES, 'Buddy']

const PRESETS = [
  { label: 'Fragmentation', size: 1000, script: 'A 300, B 200, C 300, D 150, free A, free C, E 400, compact, E 400', note: 'E needs 400 KB. 650 KB is free, but in pieces of at most 300. Compaction fixes it.' },
  { label: 'Fit strategies', size: 1000, script: 'A 100, B 100, C 300, D 100, E 50, F 350, free A, free C, free E, G 40', note: 'Three holes (100, 300, 50 KB). Switch strategy and watch where G 40 lands.' },
  { label: 'Coalescing', size: 600, script: 'A 100, B 100, C 100, D 100, free B, free D, free C, free A', note: 'Freed neighbours merge back into one big hole.' },
  { label: 'Buddy', size: 1024, script: 'A 100, B 200, C 60, D 130, free A, free C, free B, free D', note: 'Use the Buddy tab. Requests round up to powers of two, and buddies merge when both halves are free.' },
]

const HELP = {
  title: 'Dynamic Memory Allocation',
  sections: [
    { heading: 'What this shows', items: [{ text: 'How a real allocator (malloc, a kernel heap) manages variable-size requests: carving blocks out of holes, merging freed blocks, and the fragmentation that builds up over time.' }] },
    {
      heading: 'Step by step',
      items: [
        { icon: '1️⃣', label: 'Memory size', text: `Total memory in KB (16 to ${MAX_MEMORY}). The Buddy allocator needs a power of two.` },
        { icon: '2️⃣', label: 'Write operations', text: 'Separate with commas or new lines. "A 100" allocates 100 KB to A. "free A" releases it. "compact" slides all blocks together (not for Buddy).' },
        { icon: '3️⃣', label: 'Pick a strategy', text: 'First, Best, Worst or Next Fit choose a hole. Buddy rounds up to powers of two and splits and merges halves.' },
        { icon: '4️⃣', label: 'Run', text: 'Step through each operation and watch the memory bar, the holes and the fragmentation numbers.' },
      ],
    },
    {
      heading: 'Reading the numbers',
      items: [
        { icon: '▥', label: 'External fragmentation', text: 'The share of free memory that is NOT in the largest hole. 0% means all free memory is one block; high values mean large requests can fail even when enough memory is free in total.' },
        { icon: '▧', label: 'Internal fragmentation', text: 'Buddy only: memory reserved inside a block but not requested (the hatched part of a block).' },
      ],
    },
  ],
}

// A colour per process name, stable between steps
const PALETTE = ['#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#6366f1', '#a78bfa', '#84cc16', '#ec4899', '#14b8a6', '#f97316']
const colorOf = (name) => PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length]

function MemoryBar({ step, size }) {
  return (
    <div className="space-y-1">
      <div className="flex w-full h-16 rounded-lg overflow-hidden border border-os-border bg-os-bg" role="img" aria-label="Memory map">
        {step.segments.map((s) => {
          const chosen = s.start === step.chosenStart
          const wasted = s.owner !== null && s.requested ? 1 - s.requested / s.size : 0
          return (
            <motion.div
              key={`${s.start}-${s.size}`}
              layout
              style={{ width: `${(s.size / size) * 100}%`, background: s.owner ? colorOf(s.owner) + '33' : 'transparent', borderColor: s.owner ? colorOf(s.owner) : '#2a2838' }}
              className={`relative border-r flex flex-col items-center justify-center text-[10px] font-mono overflow-hidden ${chosen ? 'ring-2 ring-white ring-inset' : ''}`}
              title={`${s.owner ?? 'free'}: ${s.size} KB at address ${s.start}`}
            >
              {wasted > 0 && (
                <div className="absolute right-0 top-0 bottom-0" style={{ width: `${wasted * 100}%`, background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.18), rgba(255,255,255,0.18) 3px, transparent 3px, transparent 6px)' }} />
              )}
              <span className="relative text-white font-semibold">{s.owner ?? ''}</span>
              <span className="relative text-gray-400">{s.size}</span>
            </motion.div>
          )
        })}
      </div>
      <div className="relative h-4 text-[9px] font-mono text-gray-600">
        {step.segments.map((s) => (
          <span key={s.start} className="absolute -translate-x-0" style={{ left: `${(s.start / size) * 100}%` }}>{s.start}</span>
        ))}
        <span className="absolute right-0">{size}</span>
      </div>
    </div>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div className="bg-os-bg border border-os-border rounded-lg p-3" title={hint}>
      <div className="text-base font-bold font-mono text-cyan-300">{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  )
}

export default function DynamicMemory() {
  const [strategy, setStrategy] = useState('First Fit')
  const [sizeText, setSizeText] = useState('1000')
  const [script, setScript] = useState(PRESETS[0].script)
  const [note, setNote] = useState(PRESETS[0].note)
  const [error, setError] = useState('')
  const { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed } = usePlayer()
  const step = steps[currentStep] ?? null

  const size = useMemo(() => parseInteger(sizeText, { min: 16, max: MAX_MEMORY, label: 'Memory size' }), [sizeText])

  function run(nextStrategy = strategy) {
    setError('')
    if (!size.ok) { setError(size.error); return }
    const ops = parseScript(script)
    if (!ops.ok) { setError(ops.error); return }
    try {
      reset(nextStrategy === 'Buddy'
        ? simulateBuddy({ size: size.value, ops: ops.ops })
        : simulateDynamic({ size: size.value, ops: ops.ops, strategy: nextStrategy }))
    } catch (e) {
      setError(e.message)
    }
  }

  function choose(s) {
    setStrategy(s)
    reset([])
    setError('')
  }

  function preset(p) {
    setSizeText(String(p.size))
    setScript(p.script)
    setNote(p.note)
    if (p.label === 'Buddy') setStrategy('Buddy')
    else if (strategy === 'Buddy') setStrategy('First Fit')
    reset([])
    setError('')
  }

  const code = strategy === 'Buddy' ? BUDDY_CODE : DYNAMIC_CODE[strategy]
  const annotations = strategy === 'Buddy' ? BUDDY_ANNOTATIONS : DYNAMIC_ANNOTATIONS[strategy]
  const statsOf = step?.stats

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dynamic Memory Allocation</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Variable-size requests, splitting, coalescing and fragmentation, the way a real allocator behaves.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {ALL.map((s) => (
          <button key={s} onClick={() => choose(s)} aria-pressed={strategy === s}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${strategy === s ? 'bg-amber-500/15 border-amber-500/60 text-amber-200' : 'bg-os-surface border-os-border text-gray-400 hover:text-white'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-4 items-start">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Memory (KB)</span>
            <input value={sizeText} onChange={(e) => { setSizeText(e.target.value); reset([]) }} aria-invalid={!size.ok}
              className="w-28 bg-os-bg border border-os-border text-white rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-cyan-500" />
          </label>
          <label className="flex flex-col gap-1 flex-1 min-w-[260px]">
            <span className="text-xs text-gray-500">Operations: &quot;A 100&quot; allocates, &quot;free A&quot; releases, &quot;compact&quot; slides blocks together</span>
            <textarea value={script} rows={3} onChange={(e) => { setScript(e.target.value); reset([]) }}
              className="w-full bg-os-bg border border-os-border text-white rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-cyan-500" />
          </label>
          <div className="pt-5">
            <button onClick={() => run()} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors">Run</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-600 font-mono">Presets:</span>
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => preset(p)}
              className="text-xs px-3 py-1 rounded-lg bg-os-bg border border-os-border text-gray-400 hover:text-white hover:border-cyan-500 transition-colors font-mono">
              {p.label}
            </button>
          ))}
        </div>
        {note && <p className="text-xs text-gray-500">{note}</p>}
        {error && <p role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {step ? (
            <>
              <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Memory ({size.ok ? size.value : '?'} KB)</h3>
                  <span className="text-xs font-mono text-gray-500">{step.op ?? 'start'}</span>
                </div>
                <MemoryBar step={step} size={step.segments.reduce((a, s) => a + s.size, 0)} />
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <Stat label="In use" value={`${statsOf.utilization}%`} hint="Share of memory that is allocated" />
                  <Stat label="Free in total" value={`${statsOf.totalFree} KB`} />
                  <Stat label="Largest hole" value={`${statsOf.largestHole} KB`} hint="The biggest request that can succeed right now" />
                  <Stat label="External fragmentation" value={`${statsOf.externalFragmentation}%`} hint="Share of free memory that is outside the largest hole" />
                  {strategy === 'Buddy'
                    ? <Stat label="Internal fragmentation" value={`${statsOf.internalFragmentation} KB`} hint="Reserved but not requested" />
                    : <Stat label="Holes" value={statsOf.holes} />}
                </div>
              </div>

              <Controls
                playing={playing} onPlay={play} onPause={pause}
                onForward={stepForward} onBack={stepBack}
                onReset={() => reset([])}
                current={currentStep} max={steps.length - 1}
                speed={speed} onSpeedChange={changeSpeed}
              />

              <motion.div key={currentStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-os-surface border border-os-border rounded-xl p-4 space-y-2">
                <p className={`text-sm ${step.result === 'fail' ? 'text-rose-300' : step.result === 'error' ? 'text-amber-300' : 'text-gray-300'}`}>{step.explanation}</p>
                {step.why && <p className="text-xs text-gray-500">{step.why}</p>}
                <AIExplainer algorithm={`${strategy} dynamic memory allocation`} step={step} stepIndex={currentStep} totalSteps={steps.length} />
              </motion.div>
            </>
          ) : (
            <div className="bg-os-surface border border-dashed border-os-border rounded-xl p-8 text-center text-sm text-gray-500">
              Choose a strategy and press <span className="text-cyan-300">Run</span>, or load a preset.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <CodePanel code={code} highlightLine={step?.highlightLine ?? -1} annotations={annotations} />
          <div className="bg-os-surface border border-os-border rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
            <div className="text-gray-400 font-medium mb-2">Legend</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm border border-cyan-500 bg-cyan-500/20 inline-block" /> Allocated block</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm border border-os-border inline-block" /> Free hole</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm ring-2 ring-white inline-block" /> Block used or freed in this step</div>
            {strategy === 'Buddy' && <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-white/20 inline-block" /> Wasted inside a block</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
