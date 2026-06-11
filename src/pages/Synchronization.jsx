import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CodePanel from '../components/shared/CodePanel'
import Controls from '../components/shared/Controls'
import AIExplainer from '../components/shared/AIExplainer'
import SimHelp from '../components/shared/SimHelp'
import { usePlayer } from '../hooks/usePlayer'
import {
  RACE_CODE, RACE_ANNOTATIONS,
  MUTEX_CODE, MUTEX_ANNOTATIONS,
  raceConditionSteps, mutexSteps,
} from '../simulation/concurrency/synchronization'

const HELP = {
  title: 'Process Synchronization',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: 'Two threads both try to increment a shared counter. Without a mutex, a context switch between read and write corrupts the result — a race condition.' }],
    },
    {
      heading: 'Modes',
      items: [
        { icon: '⚠', label: 'Without Mutex', text: 'Thread A reads, gets preempted, Thread B reads the same stale value. Both write back 1 instead of 2 — lost update.' },
        { icon: '🔒', label: 'With Mutex',    text: 'Thread A acquires the lock and completes the full read-modify-write before Thread B can start. Final value is always correct.' },
      ],
    },
    {
      heading: 'Controls',
      items: [
        { icon: '▶', label: 'Run Simulation', text: 'Generates all steps for the chosen mode. Use Play or Step → to advance.' },
        { icon: '⚡', label: 'Context Switch', text: 'The amber banner indicates the OS preempted Thread A mid-operation — the key moment the race occurs.' },
      ],
    },
    {
      heading: 'Key concept',
      items: [
        { icon: '📝', label: 'Critical section', text: 'The read-modify-write sequence (temp = shared; temp++; shared = temp) is three separate instructions — not atomic. Any preemption between them can corrupt shared state.' },
      ],
    },
  ],
}

const THREAD_COLORS = {
  idle:    { border: 'border-os-border',  bg: 'bg-os-surface',    text: 'text-gray-500', label: 'IDLE'    },
  active:  { border: 'border-cyan-500',   bg: 'bg-cyan-500/10',   text: 'text-cyan-400', label: 'RUNNING' },
  blocked: { border: 'border-red-500',    bg: 'bg-red-500/10',    text: 'text-red-400',  label: 'BLOCKED' },
  done:    { border: 'border-green-500',  bg: 'bg-green-500/10',  text: 'text-green-400',label: 'DONE'    },
}

function ThreadLane({ name, state, tempVal, children }) {
  const c = THREAD_COLORS[state] ?? THREAD_COLORS.idle
  return (
    <motion.div
      animate={{ borderColor: c.border.replace('border-', '') }}
      className={`rounded-xl border-2 ${c.border} ${c.bg} p-4 space-y-2 transition-colors duration-300`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono font-bold text-white text-sm">{name}</span>
        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${c.border} ${c.text}`}>
          {c.label}
        </span>
      </div>
      <div className="font-mono text-xs text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">local register</span>
          <span className={tempVal !== null ? 'text-cyan-300 font-bold' : 'text-gray-600'}>
            {tempVal !== null ? tempVal : '—'}
          </span>
        </div>
        {children}
      </div>
    </motion.div>
  )
}

function SharedMemory({ value, event }) {
  const flash = event === 'A-write' || event === 'B-write' || event === 'race-result' || event === 'mutex-correct'
  const bug   = event === 'race-result' || event === 'race-bug'
  const ok    = event === 'mutex-correct'
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Shared Memory</span>
      <motion.div
        key={value + '-' + event}
        initial={{ scale: flash ? 1.3 : 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1
          ${bug ? 'border-red-500 bg-red-500/10' : ok ? 'border-green-500 bg-green-500/10' : 'border-os-border bg-os-bg'}`}
      >
        <span className="text-[10px] text-gray-600 font-mono">value</span>
        <span className={`font-mono font-bold text-3xl ${bug ? 'text-red-400' : ok ? 'text-green-400' : 'text-white'}`}>
          {value}
        </span>
      </motion.div>
      {bug && <span className="text-[10px] text-red-400 font-mono">WRONG!</span>}
      {ok  && <span className="text-[10px] text-green-400 font-mono">CORRECT</span>}
    </div>
  )
}

function MutexLock({ owner }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Mutex</span>
      <motion.div
        key={owner ?? 'free'}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center
          ${owner ? 'border-amber-500 bg-amber-500/10' : 'border-os-border bg-os-bg'}`}
      >
        <span className="text-2xl">{owner ? '🔒' : '🔓'}</span>
        <span className={`text-[9px] font-mono ${owner ? 'text-amber-400' : 'text-gray-600'}`}>
          {owner ? `held by ${owner}` : 'free'}
        </span>
      </motion.div>
    </div>
  )
}

function ResultBanner({ step }) {
  if (!step || (step.event !== 'race-bug' && step.event !== 'mutex-correct')) return null
  const isRace = step.event === 'race-bug'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 text-center
        ${isRace ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'}`}
    >
      <p className={`font-mono font-bold text-lg ${isRace ? 'text-red-400' : 'text-green-400'}`}>
        {isRace ? '⚠ LOST UPDATE — shared = 1, expected 2' : '✓ CORRECT — shared = 2'}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {isRace
          ? 'Both threads read the same stale value. One increment was silently discarded.'
          : 'Mutex serialized access. Both increments applied in sequence.'}
      </p>
    </motion.div>
  )
}

export default function Synchronization() {
  const [mode, setMode] = useState('race')
  const isRace = mode === 'race'

  const { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed } = usePlayer()

  function handleRun() {
    reset(isRace ? raceConditionSteps() : mutexSteps())
  }

  function switchMode(m) {
    setMode(m)
    reset([])
  }

  const step = steps[currentStep] ?? null
  const code = isRace ? RACE_CODE : MUTEX_CODE
  const annotations = isRace ? RACE_ANNOTATIONS : MUTEX_ANNOTATIONS

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Process Synchronization</h1>
          <p className="text-gray-400 mt-1 text-sm">
            See how race conditions corrupt shared data — and how a mutex prevents it.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Mode selector */}
      <div className="flex gap-3 flex-wrap items-center">
        {[
          { id: 'race',  label: '⚠ Without Mutex', desc: 'Race Condition' },
          { id: 'mutex', label: '🔒 With Mutex',    desc: 'Safe' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => switchMode(m.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border
              ${mode === m.id
                ? m.id === 'race'
                  ? 'bg-red-500/20 border-red-500 text-red-300'
                  : 'bg-green-500/20 border-green-500 text-green-300'
                : 'bg-os-surface border-os-border text-gray-400 hover:text-white'}`}
          >
            {m.label} <span className="text-xs opacity-60 ml-1">({m.desc})</span>
          </button>
        ))}
        <button
          onClick={handleRun}
          className="ml-auto px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Run Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left — visualizer */}
        <div className="space-y-4">
          {/* Thread + Memory diagram */}
          <div className="bg-os-surface border border-os-border rounded-xl p-5">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Thread A */}
              <ThreadLane
                name="Thread A"
                state={step?.threadAState ?? 'idle'}
                tempVal={step?.tempA ?? null}
              />

              {/* Center: shared memory + optional mutex */}
              <div className="flex flex-col items-center gap-4">
                <SharedMemory value={step?.shared ?? 0} event={step?.event} />
                {!isRace && <MutexLock owner={step?.lockOwner ?? null} />}
              </div>

              {/* Thread B */}
              <ThreadLane
                name="Thread B"
                state={step?.threadBState ?? 'idle'}
                tempVal={step?.tempB ?? null}
              />
            </div>

            {/* Context switch indicator */}
            <AnimatePresence>
              {step?.event === 'context-switch' && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-center"
                >
                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                    ⚡ Context Switch — OS preempted Thread A
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Result banner */}
          <ResultBanner step={step} />

          {/* Controls */}
          {steps.length > 0 && (
            <Controls
              playing={playing} onPlay={play} onPause={pause}
              onForward={stepForward} onBack={stepBack}
              onReset={() => reset([])}
              current={currentStep} max={steps.length - 1}
              speed={speed} onSpeedChange={changeSpeed}
            />
          )}

          {/* Step explanation + Why panel */}
          {step && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3"
            >
              <p className="text-sm text-gray-200">{step.explanation}</p>
              <div className="border-t border-os-border pt-3">
                <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">Why?</span>
                <p className="text-sm text-gray-400 mt-1">{step.why}</p>
              </div>
              <AIExplainer
                algorithm={isRace ? 'Race Condition' : 'Mutex Synchronization'}
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

          {/* Legend */}
          <div className="bg-os-surface border border-os-border rounded-xl p-4 text-xs space-y-2">
            <div className="text-gray-400 font-medium mb-2">Thread States</div>
            {Object.entries(THREAD_COLORS).map(([k, c]) => (
              <div key={k} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full border ${c.border}`} />
                <span className={c.text}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Key insight */}
          <div className="bg-os-surface border border-os-border rounded-xl p-4 text-xs space-y-2">
            <div className="text-gray-400 font-medium">Critical Section</div>
            <p className="text-gray-500 leading-relaxed">
              The read-modify-write sequence <span className="text-cyan-400 font-mono">temp = shared; temp++; shared = temp</span> is
              not atomic. Any context switch between these three instructions can corrupt the result.
            </p>
            <p className="text-gray-500 leading-relaxed mt-1">
              A mutex wraps the section so only one thread executes it at a time.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
