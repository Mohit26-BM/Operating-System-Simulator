import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePlayer } from '../hooks/usePlayer'
import CodePanel from '../components/shared/CodePanel'
import Controls from '../components/shared/Controls'
import AIExplainer from '../components/shared/AIExplainer'
import SimHelp from '../components/shared/SimHelp'
import {
  simulateDining, DINING_CODE, DINING_ANNOTATIONS, PHIL_COLOR,
} from '../simulation/concurrency/diningPhilosophers'

const HELP = {
  title: 'Dining Philosophers',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: '5 philosophers sit at a round table. Each needs two adjacent forks to eat. If all pick up one fork simultaneously, no one can eat — classic deadlock.' }],
    },
    {
      heading: 'Step by step',
      items: [
        { icon: '1️⃣', label: 'Steps',    text: 'How many simulation rounds to run (8–40). More steps = more eating cycles and a higher chance of seeing deadlock attempts.' },
        { icon: '2️⃣', label: 'Run',      text: 'Generate the simulation steps.' },
        { icon: '▶',   label: 'Play',     text: 'Watch philosophers transition between Thinking, Hungry, and Eating. The highlighted philosopher is the current actor.' },
      ],
    },
    {
      heading: 'States',
      items: [
        { icon: '⚪', label: 'Thinking', text: 'Not hungry, not using any forks.' },
        { icon: '🟡', label: 'Hungry',   text: 'Wants to eat but waiting for both adjacent forks to be free.' },
        { icon: '🟢', label: 'Eating',   text: 'Holding both forks — in the critical section.' },
      ],
    },
    {
      heading: 'Deadlock insight',
      items: [
        { icon: '⚠', label: 'Deadlock scenario', text: 'If every philosopher picks up their left fork simultaneously, all are Hungry holding one fork — nobody can eat forever.' },
        { icon: '✓', label: 'This solution',      text: 'Uses a resource hierarchy: even-numbered philosophers pick left then right; odd-numbered pick right then left — breaking the circular wait.' },
      ],
    },
  ],
}

const N = 5
const RADIUS = 130
const CENTER = 180

function polarToCart(angle, r) {
  const rad = (angle * Math.PI) / 180
  return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) }
}

function philosopherAngle(i) { return (i * 360) / N - 90 }
function forkAngle(i) { return ((i + 0.5) * 360) / N - 90 }

export default function DiningPhilosophers() {
  const [rounds, setRounds] = useState(16)
  const { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed } = usePlayer()
  const step = steps[currentStep] ?? null

  function handleRun() {
    reset(simulateDining(rounds))
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dining Philosophers</h1>
          <p className="text-gray-400 mt-1 text-sm">
            5 philosophers share 5 forks. Each needs both adjacent forks to eat — a classic deadlock scenario.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Config */}
      <div className="bg-os-surface border border-os-border rounded-xl p-4 flex gap-4 items-end flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Simulation Steps</span>
          <input type="number" min={8} max={40} value={rounds}
            onChange={e => setRounds(+e.target.value)}
            className="w-24 bg-os-bg border border-os-border text-white rounded-lg px-2 py-1.5 text-sm" />
        </label>
        <button onClick={handleRun}
          className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors">
          Run
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {/* Circular table SVG */}
          <div className="bg-os-surface border border-os-border rounded-xl p-4 flex flex-col items-center">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 self-start">Table View</h3>
            <svg width={CENTER * 2} height={CENTER * 2} className="overflow-visible">
              {/* Table */}
              <circle cx={CENTER} cy={CENTER} r={70} fill="#1a1825" stroke="#2d2b3d" strokeWidth={2} />
              <text x={CENTER} y={CENTER + 5} textAnchor="middle" fill="#4b5563" fontSize={11}>TABLE</text>

              {/* Forks */}
              {Array.from({ length: N }, (_, i) => {
                const pos = polarToCart(forkAngle(i), RADIUS - 48)
                const held = step?.forks?.[i]
                return (
                  <g key={`fork-${i}`}>
                    <motion.circle
                      cx={pos.x} cy={pos.y} r={10}
                      fill={held ? '#6366f1' : '#1a1825'}
                      stroke={held ? '#818cf8' : '#3d3b4d'}
                      strokeWidth={2}
                      animate={{ fill: held ? '#6366f1' : '#1a1825' }}
                      transition={{ duration: 0.2 }}
                    />
                    <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="#9ca3af" fontSize={9}>F{i}</text>
                  </g>
                )
              })}

              {/* Philosophers */}
              {Array.from({ length: N }, (_, i) => {
                const pos = polarToCart(philosopherAngle(i), RADIUS)
                const state = step?.states?.[i] ?? 'THINKING'
                const isActor = step?.actor === i
                const fillColor = state === 'EATING' ? '#10b981' : state === 'HUNGRY' ? '#f59e0b' : '#4b5563'
                const strokeColor = isActor ? '#ffffff' : fillColor

                return (
                  <g key={`phil-${i}`}>
                    <motion.circle
                      cx={pos.x} cy={pos.y} r={22}
                      fill={`${fillColor}33`}
                      stroke={strokeColor}
                      strokeWidth={isActor ? 2.5 : 1.5}
                      animate={{ r: isActor ? 24 : 22 }}
                      transition={{ duration: 0.2 }}
                    />
                    <text x={pos.x} y={pos.y - 4} textAnchor="middle" fill="white" fontSize={11} fontWeight="bold">P{i}</text>
                    <text x={pos.x} y={pos.y + 8} textAnchor="middle" fill={fillColor} fontSize={8}>{state.slice(0, 3)}</text>
                  </g>
                )
              })}
            </svg>

            {/* Legend */}
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              {[['bg-gray-500', 'Thinking'], ['bg-amber-500', 'Hungry'], ['bg-emerald-500', 'Eating']].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${c}`} />
                  {l}
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Fork (held)
              </div>
            </div>
          </div>

          {/* State table */}
          {step && (
            <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-os-border text-xs text-gray-500">
                    <th className="px-4 py-2 text-left">Philosopher</th>
                    <th className="px-4 py-2 text-left">State</th>
                    <th className="px-4 py-2 text-left">Left Fork</th>
                    <th className="px-4 py-2 text-left">Right Fork</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: N }, (_, i) => {
                    const state = step.states[i]
                    const left = step.forks[i]
                    const right = step.forks[(i + 1) % N]
                    return (
                      <tr key={i} className={`border-b border-os-border/40 ${step.actor === i ? 'bg-white/5' : ''}`}>
                        <td className="px-4 py-1.5 font-mono text-gray-300">P{i}</td>
                        <td className="px-4 py-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PHIL_COLOR[state]}`}>{state}</span>
                        </td>
                        <td className={`px-4 py-1.5 text-xs font-mono ${left ? 'text-cyan-400' : 'text-gray-600'}`}>
                          F{i} {left ? '(held)' : '(free)'}
                        </td>
                        <td className={`px-4 py-1.5 text-xs font-mono ${right ? 'text-cyan-400' : 'text-gray-600'}`}>
                          F{(i + 1) % N} {right ? '(held)' : '(free)'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
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
              <AIExplainer algorithm="Dining Philosophers Problem" step={step} stepIndex={currentStep} totalSteps={steps.length} />
            </motion.div>
          )}
        </div>

        <div>
          <CodePanel code={DINING_CODE} highlightLine={step?.highlightLine ?? -1} annotations={DINING_ANNOTATIONS} />
        </div>
      </div>
    </div>
  )
}

