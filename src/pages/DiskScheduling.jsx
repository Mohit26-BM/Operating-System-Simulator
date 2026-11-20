import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DiskTrack from '../components/disk/DiskTrack'
import CodePanel from '../components/shared/CodePanel'
import Controls from '../components/shared/Controls'
import AIExplainer from '../components/shared/AIExplainer'
import SimHelp from '../components/shared/SimHelp'
import { usePlayer } from '../hooks/usePlayer'
import { runDisk, getDiskCode, getDiskAnnotations, DISK_ALGORITHMS } from '../simulation/disk'
import { parseInteger, parseIntegerList } from '../simulation/parse'

const ALGORITHMS = DISK_ALGORITHMS
const SWEEPING = ['SCAN', 'C-SCAN', 'LOOK', 'C-LOOK']
const DEFAULT_REQUESTS = '98 183 37 122 14 124 65 67'
const MAX_CYLINDER = 199

const HELP = {
  title: 'Disk Scheduling',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: 'How the OS reorders I/O requests to minimize total disk head movement. The head starts at a position and sweeps to service requests.' }],
    },
    {
      heading: 'Step by step',
      items: [
        { icon: '1️⃣', label: 'Pick algorithm', text: 'FCFS: service in arrival order. SSTF: nearest first. SCAN: sweep one direction. C-SCAN: sweep and wrap.' },
        { icon: '2️⃣', label: 'Set head position', text: 'Where the disk head starts (0–199).' },
        { icon: '3️⃣', label: 'Enter requests', text: 'Space-separated cylinder numbers, all 0–199.' },
        { icon: '4️⃣', label: 'Run → Play', text: 'Watch the head move step-by-step. Total seek distance updates each move.' },
      ],
    },
    {
      heading: 'Input guide',
      items: [
        { icon: '📍', label: 'Head position', text: 'Integer 0–199. Represents the starting cylinder position.' },
        { icon: '📋', label: 'Request queue', text: 'Space-separated integers 0–199. Duplicates allowed. Order matters for FCFS only.' },
      ],
    },
    {
      heading: 'Algorithm summary',
      items: [
        { icon: '→', label: 'FCFS',   text: 'First-come first-served. Simple but causes lots of zig-zag movement.' },
        { icon: '◎', label: 'SSTF',   text: 'Shortest Seek Time First. Fast average but can starve far requests.' },
        { icon: '⇕', label: 'SCAN',   text: 'Elevator: always runs to the disk edge, then reverses.' },
        { icon: '⇒', label: 'C-SCAN', text: 'Circular SCAN: runs to the edge, jumps back to the start and sweeps the same way again. Uniform wait time.' },
        { icon: '↕', label: 'LOOK',   text: 'Like SCAN, but turns around at the last request instead of the edge. Less head movement.' },
        { icon: '↻', label: 'C-LOOK', text: 'Like C-SCAN, but jumps straight to the lowest waiting request. The jump is counted in the total.' },
      ],
    },
  ],
}

export default function DiskScheduling() {
  const [algorithm, setAlgorithm] = useState('FCFS')
  const [headInput, setHeadInput] = useState('53')
  const [requestsInput, setRequestsInput] = useState(DEFAULT_REQUESTS)
  const [direction, setDirection] = useState('up')
  const [errors, setErrors] = useState({})
  const { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed } = usePlayer()

  const step = steps[currentStep] ?? null

  function validate() {
    const e = {}
    const head = parseInteger(headInput, { min: 0, max: MAX_CYLINDER, label: 'Head position' })
    if (!head.ok) e.head = head.error
    const reqs = parseIntegerList(requestsInput, { min: 0, max: MAX_CYLINDER, maxCount: 100, label: 'Requests' })
    if (!reqs.ok) e.requests = reqs.error
    return { e, head: head.value, requests: reqs.values }
  }

  function handleRun() {
    const { e, head, requests } = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    try {
      reset(runDisk({ head, requests, algorithm, maxCylinder: MAX_CYLINDER, direction }))
    } catch (err) {
      setErrors({ requests: err.message })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Disk Scheduling</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Watch the disk head move across cylinders to service I/O requests.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Algorithm selector */}
      <div className="flex gap-2 flex-wrap">
        {ALGORITHMS.map(algo => (
          <button
            key={algo}
            onClick={() => { setAlgorithm(algo); reset([]) }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              algorithm === algo
                ? 'bg-rose-600 text-white'
                : 'bg-os-surface text-gray-400 hover:text-white border border-os-border'
            }`}
          >
            {algo}
          </button>
        ))}
      </div>

      {/* Config */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 flex flex-wrap gap-4 items-start">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Head Position (0–{MAX_CYLINDER})</span>
          <input
            value={headInput}
            onChange={e => { setHeadInput(e.target.value); setErrors(ex => ({ ...ex, head: undefined })) }}
            className={`w-28 bg-os-bg border text-white rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none
              ${errors.head ? 'border-red-500' : 'border-os-border focus:border-cyan-500'}`}
          />
          {errors.head && <span className="text-[10px] text-red-400">{errors.head}</span>}
        </label>
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs text-gray-500">Request Queue — space-separated cylinders (0–{MAX_CYLINDER})</span>
          <input
            value={requestsInput}
            onChange={e => { setRequestsInput(e.target.value); setErrors(ex => ({ ...ex, requests: undefined })) }}
            className={`w-full bg-os-bg border text-white rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none
              ${errors.requests ? 'border-red-500' : 'border-os-border focus:border-cyan-500'}`}
          />
          {errors.requests && <span className="text-[10px] text-red-400">{errors.requests}</span>}
        </label>
        {SWEEPING.includes(algorithm) && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">First direction</span>
            <div className="flex gap-1">
              {[['up', 'Up (to 199)'], ['down', 'Down (to 0)']].map(([v, label]) => (
                <button key={v} type="button" onClick={() => { setDirection(v); reset([]) }} aria-pressed={direction === v}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${direction === v ? 'bg-rose-600/20 border-rose-500/50 text-rose-200' : 'border-os-border text-gray-400 hover:text-white'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="pt-5">
          <button
            onClick={handleRun}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Run
          </button>
        </div>
      </div>

      {/* Stats */}
      {steps.length > 0 && (
        <div className="flex gap-4 flex-wrap">
          {[
            { label: 'Total Movement', value: `${steps[steps.length - 1]?.total} cylinders`, color: 'text-rose-400' },
            { label: 'Requests',       value: steps.length - 1,                              color: 'text-cyan-400' },
            { label: 'Avg per Request',value: `${(steps[steps.length - 1]?.total / (steps.length - 1)).toFixed(1)} cyl`, color: 'text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-os-surface border border-os-border rounded-xl px-4 py-2">
              <div className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <DiskTrack steps={steps} currentStep={currentStep} maxCylinder={MAX_CYLINDER} />

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

          {step?.explanation && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-os-surface border border-os-border rounded-xl p-4"
            >
              <p className="text-sm text-gray-300">{step.explanation}</p>
              <AIExplainer
                algorithm={`${algorithm} Disk Scheduling`}
                step={step}
                stepIndex={currentStep}
                totalSteps={steps.length}
              />
            </motion.div>
          )}
        </div>

        <div>
          <CodePanel
            code={getDiskCode(algorithm)}
            highlightLine={step?.highlightLine ?? -1}
            annotations={getDiskAnnotations(algorithm)}
          />
        </div>
      </div>
    </div>
  )
}
