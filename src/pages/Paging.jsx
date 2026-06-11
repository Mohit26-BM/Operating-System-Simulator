import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MemoryGrid from '../components/paging/MemoryGrid'
import PageTable from '../components/paging/PageTable'
import TLBCache from '../components/paging/TLBCache'
import AddressTranslator from '../components/paging/AddressTranslator'
import CodePanel from '../components/shared/CodePanel'
import Controls from '../components/shared/Controls'
import AIExplainer from '../components/shared/AIExplainer'
import SimHelp from '../components/shared/SimHelp'
import { usePlayer } from '../hooks/usePlayer'
import { simulatePaging, getPagingCode, getPagingAnnotations } from '../simulation/paging'

const ALGORITHMS = ['FIFO', 'LRU', 'Optimal']

const HELP = {
  title: 'Memory & Paging',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: 'How the OS translates virtual page numbers to physical frame numbers using a page table and TLB. A page fault occurs when the page isn\'t loaded yet.' }],
    },
    {
      heading: 'Step by step',
      items: [
        { icon: '1️⃣', label: 'Pick algorithm', text: 'FIFO: evict oldest. LRU: evict least recently used. Optimal: evict the one needed furthest in future.' },
        { icon: '2️⃣', label: 'Set frames',     text: 'Number of physical memory slots (1–8). Fewer frames = more page faults.' },
        { icon: '3️⃣', label: 'Reference string', text: 'Space-separated page numbers, e.g. "1 2 3 4 1 2 5". Each number is one memory access.' },
        { icon: '4️⃣', label: 'Run → Play',     text: 'Each step processes one page reference. Watch the TLB, page table, and frame grid update.' },
      ],
    },
    {
      heading: 'Input guide',
      items: [
        { icon: '🗂', label: 'Frames',           text: 'Integer from 1–8. More frames = better hit rate but more RAM used.' },
        { icon: '📝', label: 'Reference string', text: 'Space-separated non-negative integers. Non-numeric characters are ignored. At least 2 entries required.' },
      ],
    },
    {
      heading: 'Reading the output',
      items: [
        { icon: '🟢', label: 'HIT',        text: 'Page was in memory. TLB or page table returned the frame directly.' },
        { icon: '🔴', label: 'PAGE FAULT', text: 'Page not in memory. A victim frame was evicted and the new page loaded from disk.' },
        { icon: '⚡', label: 'TLB hit',    text: 'Fastest path — found in the small hardware cache without touching the page table.' },
      ],
    },
  ],
}

export default function Paging() {
  const [frameCount, setFrameCount] = useState(3)
  const [refString, setRefString] = useState('1 2 3 4 1 2 5 1 2 3 4 5')
  const [algorithm, setAlgorithm] = useState('FIFO')
  const [errors, setErrors] = useState({})
  const { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed } = usePlayer()

  const step = steps[currentStep] ?? null
  const hits = steps.filter(s => s.event === 'hit').length
  const faults = steps.filter(s => s.event === 'fault').length

  function validate() {
    const e = {}
    const fc = Number(frameCount)
    if (!Number.isInteger(fc) || fc < 1 || fc > 8) e.frames = 'Must be 1–8'
    const pages = refString.trim().split(/\s+/).map(Number)
    if (pages.length < 2) e.ref = 'Enter at least 2 page numbers'
    if (pages.some(isNaN)) e.ref = 'Reference string must contain only numbers separated by spaces'
    return e
  }

  function handleRun() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    const pages = refString.trim().split(/\s+/).map(Number)
    reset(simulatePaging({ frames: frameCount, referenceString: pages, algorithm }))
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Memory & Paging</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Watch how virtual page addresses are translated to physical frames, step by step.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Algorithm selector */}
      <div className="flex gap-2 flex-wrap items-end">
        {ALGORITHMS.map(algo => (
          <button
            key={algo}
            onClick={() => { setAlgorithm(algo); reset([]) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              algorithm === algo
                ? 'bg-emerald-600 text-white'
                : 'bg-os-surface text-gray-400 hover:text-white border border-os-border'
            }`}
          >
            {algo}
          </button>
        ))}
        <div className="flex items-start gap-3 ml-4 flex-wrap">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Frames (1–8)</span>
            <input
              type="number" min={1} max={8} value={frameCount}
              onChange={e => { setFrameCount(+e.target.value); setErrors(ex => ({ ...ex, frames: undefined })) }}
              className={`w-20 bg-os-surface border text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none
                ${errors.frames ? 'border-red-500' : 'border-os-border focus:border-cyan-500'}`}
            />
            {errors.frames && <span className="text-[10px] text-red-400">{errors.frames}</span>}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">Reference String (space-separated numbers)</span>
            <input
              value={refString}
              onChange={e => { setRefString(e.target.value); setErrors(ex => ({ ...ex, ref: undefined })) }}
              className={`w-64 bg-os-surface border text-white rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none
                ${errors.ref ? 'border-red-500' : 'border-os-border focus:border-cyan-500'}`}
            />
            {errors.ref && <span className="text-[10px] text-red-400">{errors.ref}</span>}
          </label>
          <div className="pt-5">
            <button
              onClick={handleRun}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Run
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {steps.length > 0 && (
        <div className="flex gap-4">
          {[
            { label: 'Page Faults', value: faults, color: 'text-rose-400' },
            { label: 'Page Hits', value: hits, color: 'text-emerald-400' },
            { label: 'Hit Rate', value: `${((hits / steps.length) * 100).toFixed(1)}%`, color: 'text-cyan-400' },
          ].map(s => (
            <div key={s.label} className="bg-os-surface border border-os-border rounded-xl px-4 py-2">
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <AddressTranslator step={step} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TLBCache step={step} />
            <PageTable step={step} />
            <MemoryGrid step={step} frameCount={frameCount} />
          </div>

          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Controls
                  playing={playing} onPlay={play} onPause={pause}
                  onForward={stepForward} onBack={stepBack}
                  onReset={() => reset([])}
                  current={currentStep} max={steps.length - 1}
                  speed={speed} onSpeedChange={changeSpeed}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {step && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-os-surface border border-os-border rounded-xl p-4"
            >
              <p className="text-sm text-gray-300">{step.explanation}</p>
              <AIExplainer
                algorithm={`${algorithm} Page Replacement`}
                step={step}
                stepIndex={currentStep}
                totalSteps={steps.length}
              />
            </motion.div>
          )}
        </div>

        <div>
          <CodePanel
            code={getPagingCode(algorithm)}
            highlightLine={step?.highlightLine ?? -1}
            annotations={getPagingAnnotations(algorithm)}
          />
        </div>
      </div>
    </div>
  )
}
