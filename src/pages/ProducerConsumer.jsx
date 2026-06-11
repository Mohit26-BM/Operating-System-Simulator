import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '../hooks/usePlayer'
import CodePanel from '../components/shared/CodePanel'
import Controls from '../components/shared/Controls'
import AIExplainer from '../components/shared/AIExplainer'
import SimHelp from '../components/shared/SimHelp'
import { simulateProducerConsumer, PC_CODE, PC_ANNOTATIONS } from '../simulation/concurrency/producerConsumer'

function SemaphoreDisplay({ label, value, max, color }) {
  return (
    <div className="bg-os-bg border border-os-border rounded-xl p-3 text-center">
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {max !== undefined && (
        <div className="mt-2 flex gap-1 justify-center">
          {Array.from({ length: max }, (_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < value ? color.replace('text-', 'bg-') : 'bg-os-border'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

const HELP = {
  title: 'Producer-Consumer',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: 'Two threads share a bounded buffer. The producer adds items; the consumer removes them. Semaphores prevent overflow and underflow without busy-waiting.' }],
    },
    {
      heading: 'Step by step',
      items: [
        { icon: '1️⃣', label: 'Buffer Size',  text: 'Number of slots in the shared buffer (2–8). The producer blocks when full; the consumer blocks when empty.' },
        { icon: '2️⃣', label: 'Operations',   text: 'How many produce/consume actions to simulate (4–30).' },
        { icon: '3️⃣', label: 'Run → Play',   text: 'Watch the semaphores (empty, mutex, full) change and the buffer fill/drain.' },
      ],
    },
    {
      heading: 'Semaphore guide',
      items: [
        { icon: '🟡', label: 'empty', text: 'Free slots in the buffer. Producer does wait(empty) before producing.' },
        { icon: '🔵', label: 'mutex', text: 'Binary mutex protecting the buffer. Only one thread enters the critical section at a time.' },
        { icon: '🟢', label: 'full',  text: 'Items in the buffer. Consumer does wait(full) before consuming.' },
      ],
    },
  ],
}

export default function ProducerConsumer() {
  const [bufferSize, setBufferSize] = useState(5)
  const [stepCount, setStepCount] = useState(12)
  const [errors, setErrors] = useState({})
  const { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed } = usePlayer()

  const step = steps[currentStep] ?? null

  function validate() {
    const e = {}
    if (!Number.isInteger(bufferSize) || bufferSize < 2 || bufferSize > 8)
      e.bufferSize = 'Must be 2–8'
    if (!Number.isInteger(stepCount) || stepCount < 4 || stepCount > 30)
      e.stepCount = 'Must be 4–30'
    return e
  }

  function handleRun() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    reset(simulateProducerConsumer(bufferSize, stepCount))
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Producer-Consumer Problem</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Watch semaphores coordinate producer and consumer threads around a shared bounded buffer.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Config */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 flex flex-wrap gap-4 items-start">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Buffer Size (2–8)</span>
          <input type="number" min={2} max={8} value={bufferSize}
            onChange={e => { setBufferSize(+e.target.value); setErrors(ex => ({ ...ex, bufferSize: undefined })) }}
            className={`w-20 bg-os-bg border text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none
              ${errors.bufferSize ? 'border-red-500' : 'border-os-border focus:border-cyan-500'}`} />
          {errors.bufferSize && <span className="text-[10px] text-red-400">{errors.bufferSize}</span>}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Operations (4–30)</span>
          <input type="number" min={4} max={30} value={stepCount}
            onChange={e => { setStepCount(+e.target.value); setErrors(ex => ({ ...ex, stepCount: undefined })) }}
            className={`w-20 bg-os-bg border text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none
              ${errors.stepCount ? 'border-red-500' : 'border-os-border focus:border-cyan-500'}`} />
          {errors.stepCount && <span className="text-[10px] text-red-400">{errors.stepCount}</span>}
        </label>
        <div className="pt-5">
          <button onClick={handleRun}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
            Run
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {step && (
            <>
              {/* Semaphores */}
              <div className="grid grid-cols-3 gap-3">
                <SemaphoreDisplay label="empty (free slots)" value={step.empty} max={bufferSize} color="text-amber-400" />
                <SemaphoreDisplay label="mutex (lock)" value={step.mutex} max={1} color="text-cyan-400" />
                <SemaphoreDisplay label="full (items)" value={step.full} max={bufferSize} color="text-emerald-400" />
              </div>

              {/* Actor badge */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  step.actor === 'producer'
                    ? 'bg-blue-500/20 text-blue-300'
                    : step.actor === 'consumer'
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-os-border text-gray-400'
                }`}>
                  {step.actor ? `${step.actor.toUpperCase()} → ${step.action}` : 'Initializing'}
                </span>
              </div>

              {/* Buffer */}
              <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Shared Buffer ({step.buffer.length}/{bufferSize})
                </h3>
                <div className="flex gap-2">
                  {Array.from({ length: bufferSize }, (_, i) => {
                    const item = step.buffer[i]
                    return (
                      <motion.div
                        key={i}
                        animate={item ? { scale: [1, 1.1, 1] } : {}}
                        className={`flex-1 h-14 rounded-lg border-2 flex items-center justify-center font-mono text-sm font-bold transition-all ${
                          item
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-os-bg border-os-border text-gray-600'
                        }`}
                      >
                        {item ?? '—'}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
              <p className="text-sm text-gray-300">{step.explanation}</p>
              <AIExplainer algorithm="Producer-Consumer with Semaphores" step={step} stepIndex={currentStep} totalSteps={steps.length} />
            </motion.div>
          )}
        </div>

        <div>
          <CodePanel code={PC_CODE} highlightLine={step?.highlightLine ?? -1} annotations={PC_ANNOTATIONS} />
        </div>
      </div>
    </div>
  )
}

