import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProcessForm from '../components/scheduling/ProcessForm'
import GanttChart from '../components/scheduling/GanttChart'
import ProcessTable from '../components/scheduling/ProcessTable'
import CodePanel from '../components/shared/CodePanel'
import Controls from '../components/shared/Controls'
import AIExplainer from '../components/shared/AIExplainer'
import SimHelp from '../components/shared/SimHelp'
import { usePlayer } from '../hooks/usePlayer'
import { runScheduling, getCode, getAnnotations, SCHEDULING_ALGORITHMS } from '../simulation/scheduling'
import { parseInteger, parseIntegerList } from '../simulation/parse'
import MetricsPanel from '../components/scheduling/MetricsPanel'

const ALGORITHMS = SCHEDULING_ALGORITHMS

const HELP = {
  title: 'CPU Scheduling',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: 'How the OS picks which process runs on the CPU next. Each algorithm uses a different rule — arrival order, shortest job, time slices, or priority.' }],
    },
    {
      heading: 'Step by step',
      items: [
        { icon: '1️⃣', label: 'Add processes', text: 'Fill in Arrival Time, Burst Time, and Priority, then click + Add. Add 2–8 processes.' },
        { icon: '2️⃣', label: 'Pick algorithm', text: 'FCFS, SJF, SRTF (preemptive SJF), Round Robin, Priority, preemptive Priority (with optional aging) or a multilevel feedback queue (MLFQ). Round Robin and MLFQ have time quanta.' },
        { icon: '3️⃣', label: 'Run Simulation', text: 'Generates a step-by-step schedule.' },
        { icon: '▶',   label: 'Play / Step',   text: 'Watch the Gantt chart build. Use Next → to step manually.' },
      ],
    },
    {
      heading: 'Input guide',
      items: [
        { icon: '⏱', label: 'Arrival Time', text: 'When the process enters the ready queue (≥ 0). Use 0 for all to simulate simultaneous arrival.' },
        { icon: '⚡', label: 'Burst Time',   text: 'Total CPU time the process needs (≥ 1). Shorter bursts matter most for SJF.' },
        { icon: '⭐', label: 'Priority',     text: 'Used only by the Priority algorithms. Lower number = higher priority.' },
        { icon: '💾', label: 'I/O (optional)', text: 'Write AFTER:DURATION pairs, for example 2:3 4:1. After 2 CPU units the process leaves the CPU for 3 units of I/O, then returns to the back of the ready queue. While it waits, another process can use the CPU.' },
        { icon: '⏲', label: 'Quantum',      text: 'Round Robin only. How many time units each process runs before being preempted (≥ 1).' },
      ],
    },
    {
      heading: 'Reading the output',
      items: [
        { icon: '📊', label: 'Gantt chart',    text: 'Each colored block is one process running. Gaps are CPU idle.' },
        { icon: '📈', label: 'Metrics panel',  text: 'Appears at the last step. Shows turnaround, wait, and response times per process.' },
        { icon: '🔢', label: 'Step counter',   text: 'Each step = one scheduling decision. Context switches count as separate steps.' },
      ],
    },
  ],
}

export default function Scheduling() {
  const [processes, setProcesses] = useState([])
  const [algorithm, setAlgorithm] = useState('FCFS')
  const [quantum, setQuantum] = useState(2)
  const [quantumError, setQuantumError] = useState('')
  const [quantaText, setQuantaText] = useState('2 4 8')
  const [agingText, setAgingText] = useState('0')
  const [boostText, setBoostText] = useState('0')
  const [runError, setRunError] = useState('')
  const { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed } = usePlayer()

  const step = steps[currentStep] ?? null
  const withIo = processes.some(p => p.io?.length)
  const code = getCode(algorithm, withIo)
  const annotations = getAnnotations(algorithm, withIo)

  function handleRun() {
    setRunError('')
    if (processes.length === 0) { setRunError('Add at least one process first.'); return }
    if (algorithm === 'Round Robin' && (quantum < 1 || !Number.isInteger(quantum))) {
      setQuantumError('Quantum must be a whole number ≥ 1'); return
    }
    const options = {}
    if (algorithm === 'MLFQ') {
      const q = parseIntegerList(quantaText, { min: 1, max: 50, minCount: 2, maxCount: 5, label: 'Queue quanta' })
      if (!q.ok) { setRunError(q.error); return }
      const b = parseInteger(boostText, { min: 0, max: 1000, label: 'Boost interval' })
      if (!b.ok) { setRunError(b.error); return }
      options.quanta = q.values
      options.boost = b.value
    }
    if (algorithm === 'Priority (Preemptive)') {
      const a = parseInteger(agingText, { min: 0, max: 1000, label: 'Aging interval' })
      if (!a.ok) { setRunError(a.error); return }
      options.aging = a.value
    }
    try {
      reset(runScheduling(processes, algorithm, quantum, options))
    } catch (err) {
      setRunError(err.message)
    }
  }

  function handleQuantumChange(val) {
    const n = +val
    setQuantum(n)
    setQuantumError(n < 1 ? 'Must be ≥ 1' : '')
  }

  function handleAddProcess(p) {
    setProcesses(prev => [...prev, p])
    setRunError('')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">CPU Scheduling</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Visualize how the OS decides which process runs next.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Algorithm selector */}
      <div className="flex gap-2 flex-wrap items-center">
        {ALGORITHMS.map(algo => (
          <button
            key={algo}
            onClick={() => { setAlgorithm(algo); reset([]); setRunError('') }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              algorithm === algo
                ? 'bg-cyan-600 text-white'
                : 'bg-os-surface text-gray-400 hover:text-white border border-os-border'
            }`}
          >
            {algo}
          </button>
        ))}
        {algorithm === 'MLFQ' && (
          <div className="flex items-end gap-3 ml-4 flex-wrap">
            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500">Quantum per queue (Q0 first)</span>
              <input value={quantaText} onChange={e => setQuantaText(e.target.value)}
                className="w-28 bg-os-surface border border-os-border text-white rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:border-cyan-500" />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500">Boost every (0 = off)</span>
              <input value={boostText} onChange={e => setBoostText(e.target.value)}
                className="w-20 bg-os-surface border border-os-border text-white rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:border-cyan-500" />
            </label>
          </div>
        )}
        {algorithm === 'Priority (Preemptive)' && (
          <label className="flex flex-col gap-0.5 ml-4">
            <span className="text-xs text-gray-500">Aging: improve priority every N waiting units (0 = off)</span>
            <input value={agingText} onChange={e => setAgingText(e.target.value)}
              className="w-20 bg-os-surface border border-os-border text-white rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:border-cyan-500" />
          </label>
        )}
        {algorithm === 'Round Robin' && (
          <div className="flex items-center gap-2 ml-4">
            <span className="text-sm text-gray-400">Quantum</span>
            <div className="flex flex-col gap-0.5">
              <input
                type="number" min={1} value={quantum}
                onChange={e => handleQuantumChange(e.target.value)}
                className={`w-16 bg-os-surface border text-white rounded-lg px-2 py-1 text-sm focus:outline-none
                  ${quantumError ? 'border-red-500' : 'border-os-border focus:border-cyan-500'}`}
              />
              {quantumError && <span className="text-[10px] text-red-400">{quantumError}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left — visualizer */}
        <div className="space-y-4">
          <ProcessForm
            onAdd={handleAddProcess}
            onClear={() => { setProcesses([]); reset([]); setRunError('') }}
            processCount={processes.length}
          />
          <ProcessTable processes={processes} step={step} />

          {runError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {runError}
            </p>
          )}

          <button
            onClick={handleRun}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Run Simulation
          </button>

          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <GanttChart steps={steps} currentStep={currentStep} />
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

          {steps.length > 0 && currentStep === steps.length - 1 && (
            <MetricsPanel steps={steps} processes={processes} />
          )}

          {step && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-os-surface border border-os-border rounded-xl p-4"
            >
              <p className="text-sm text-gray-300">{step.explanation}</p>
              <AIExplainer
                algorithm={`${algorithm} Scheduling`}
                step={step}
                stepIndex={currentStep}
                totalSteps={steps.length}
              />
            </motion.div>
          )}
        </div>

        {/* Right — pseudocode */}
        <div className="space-y-4">
          <CodePanel
            code={code}
            highlightLine={step?.highlightLine ?? -1}
            annotations={annotations}
          />
          <div className="bg-os-surface border border-os-border rounded-xl p-4 text-xs text-gray-500 space-y-1.5">
            <div className="text-gray-400 font-medium mb-2">Legend</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" /> Running</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-amber-500 inline-block" /> Ready queue</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-gray-700 inline-block" /> Idle</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" /> Waiting for I/O</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Completed</div>
          </div>
        </div>
      </div>
    </div>
  )
}
