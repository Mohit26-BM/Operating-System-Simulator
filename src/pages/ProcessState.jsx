import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '../hooks/usePlayer'
import CodePanel from '../components/shared/CodePanel'
import Controls from '../components/shared/Controls'
import AIExplainer from '../components/shared/AIExplainer'
import SimHelp from '../components/shared/SimHelp'
import {
  generateProcessLifecycle,
  PROCESS_STATE_CODE,
  PROCESS_STATE_ANNOTATIONS,
  STATE_COLOR,
} from '../simulation/process/processState'

const HELP = {
  title: 'Process State Machine',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: 'A process moves through five states during its life: New → Ready → Running → Waiting → Terminated. The OS scheduler drives these transitions.' }],
    },
    {
      heading: 'Step by step',
      items: [
        { icon: '☑', label: 'I/O cycle',  text: 'When checked, the process will pause for I/O (RUNNING → WAITING → READY) before completing.' },
        { icon: '☑', label: 'Preemption', text: 'When checked, the OS preempts the process mid-run and moves it back to READY (simulates time-slicing).' },
        { icon: '▶', label: 'Start',      text: 'Click "Start Simulation" then Play or Step → to watch each transition.' },
      ],
    },
    {
      heading: 'State guide',
      items: [
        { icon: '🆕', label: 'NEW',        text: 'Process is being created.' },
        { icon: '⏳', label: 'READY',      text: 'In the ready queue, waiting for the CPU.' },
        { icon: '⚡', label: 'RUNNING',    text: 'Executing on the CPU right now.' },
        { icon: '💤', label: 'WAITING',    text: 'Blocked, waiting for I/O or an event.' },
        { icon: '✓',  label: 'TERMINATED', text: 'Process has finished and resources are freed.' },
      ],
    },
  ],
}

function StateDiagram({ currentState, visitedTransitions }) {
  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-6">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Process State Diagram</h3>

      <div className="flex flex-col items-center gap-3">
        <StateNode state="NEW" current={currentState} />

        <Arrow label="admitted" active={visitedTransitions.includes('NEW→READY')} />

        <div className="flex items-center gap-8">
          <StateNode state="READY" current={currentState} />
          <div className="flex flex-col items-center gap-1">
            <Arrow label="dispatched" horizontal active={visitedTransitions.includes('READY→RUNNING')} />
            <Arrow label="preempted" horizontal reverse active={visitedTransitions.includes('RUNNING→READY')} />
          </div>
          <StateNode state="RUNNING" current={currentState} />
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Arrow label="I/O complete" active={visitedTransitions.includes('WAITING→READY')} reverse />
            <StateNode state="WAITING" current={currentState} />
            <Arrow label="I/O request" active={visitedTransitions.includes('RUNNING→WAITING')} />
          </div>
          <div className="w-8" />
          <div className="flex flex-col items-center gap-2">
            <Arrow label="exit()" active={visitedTransitions.includes('RUNNING→TERMINATED')} />
            <StateNode state="TERMINATED" current={currentState} />
          </div>
        </div>
      </div>
    </div>
  )
}

function StateNode({ state, current }) {
  const isActive = current === state
  return (
    <motion.div
      animate={isActive ? { scale: 1.08 } : { scale: 1 }}
      className={`px-5 py-2 rounded-xl border-2 font-mono text-sm font-bold transition-all duration-200 ${STATE_COLOR[state]} ${isActive ? 'shadow-lg' : ''}`}
    >
      {state}
    </motion.div>
  )
}

function Arrow({ label, horizontal, reverse, active }) {
  return (
    <div className={`flex ${horizontal ? 'flex-row' : 'flex-col'} items-center gap-1`}>
      <span className={`text-[10px] ${active ? 'text-cyan-400' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-xs ${active ? 'text-cyan-400' : 'text-gray-700'}`}>
        {horizontal ? (reverse ? '←' : '→') : (reverse ? '↑' : '↓')}
      </span>
    </div>
  )
}

export default function ProcessState() {
  const [includeIO, setIncludeIO] = useState(true)
  const [includePreemption, setIncludePreemption] = useState(false)
  const { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed } = usePlayer()

  const step = steps[currentStep] ?? null
  const visited = steps.slice(0, currentStep + 1)
  const visitedTransitions = visited.filter(s => s.transition).map(s => {
    const [from, , to] = s.transition.split(' ')
    return `${from}→${to}`
  })

  function handleRun() {
    reset(generateProcessLifecycle(includeIO, includePreemption))
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Process State Simulator</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Follow a process through its entire lifecycle — from creation to termination.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Config */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 flex flex-wrap gap-6 items-end">
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={includeIO} onChange={e => setIncludeIO(e.target.checked)}
            className="w-4 h-4 accent-cyan-500" />
          <span className="text-sm text-gray-300">Include I/O Wait cycle</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={includePreemption} onChange={e => setIncludePreemption(e.target.checked)}
            className="w-4 h-4 accent-cyan-500" />
          <span className="text-sm text-gray-300">Include Preemption</span>
        </label>
        <button
          onClick={handleRun}
          className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Start Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {steps.length > 0 && (
            <StateDiagram currentState={step?.state} visitedTransitions={visitedTransitions} />
          )}

          {steps.length > 0 && (
            <div className="bg-os-surface border border-os-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Transition Log</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {visited.filter(s => s.transition).map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-gray-600 text-xs w-4">{i + 1}.</span>
                    <span className="text-cyan-300 font-mono text-xs">{s.transition}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

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
            <motion.div key={currentStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-os-surface border border-os-border rounded-xl p-4">
              {step.transition && (
                <div className="text-xs text-cyan-400 font-mono mb-1">{step.transition}</div>
              )}
              <p className="text-sm text-gray-300">{step.explanation}</p>
              <AIExplainer algorithm="Process State Machine" step={step} stepIndex={currentStep} totalSteps={steps.length} />
            </motion.div>
          )}
        </div>

        <div>
          <CodePanel
            code={PROCESS_STATE_CODE}
            highlightLine={step?.highlightLine ?? -1}
            annotations={PROCESS_STATE_ANNOTATIONS}
          />
        </div>
      </div>
    </div>
  )
}