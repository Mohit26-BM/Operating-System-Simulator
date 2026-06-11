import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FIRST_FIT_CODE, BEST_FIT_CODE, WORST_FIT_CODE,
  ANNOTATIONS, DEFAULT_BLOCKS, DEFAULT_REQUESTS,
  runMemoryAllocation,
} from '../simulation/memoryAllocation'
import CodePanel from '../components/shared/CodePanel'
import Controls from '../components/shared/Controls'
import AIExplainer from '../components/shared/AIExplainer'
import SimHelp from '../components/shared/SimHelp'
import { usePlayer } from '../hooks/usePlayer'

const HELP = {
  title: 'Memory Allocation',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: 'The OS must find a free memory block for each process request. Three strategies — First Fit, Best Fit, Worst Fit — make different trade-offs between speed and fragmentation.' }],
    },
    {
      heading: 'Setup (fixed)',
      items: [
        { icon: '🟦', label: 'Memory blocks', text: '5 blocks of sizes: 100, 500, 200, 300, 600 KB (1700 KB total). Proportionally shown in the bar.' },
        { icon: '📋', label: 'Requests',      text: '4 processes requesting: 212, 417, 112, 426 KB. The allocator places each one into a block.' },
      ],
    },
    {
      heading: 'Strategies',
      items: [
        { icon: '→', label: 'First Fit', text: 'Scans from the start and picks the first block that fits. Fastest but can leave mid-range fragments.' },
        { icon: '↓', label: 'Best Fit',  text: 'Finds the smallest block that still fits. Minimizes wasted space per request but is slower to scan.' },
        { icon: '↑', label: 'Worst Fit', text: 'Picks the largest available block. Leaves bigger leftovers — hoping future requests can fill them.' },
      ],
    },
    {
      heading: 'Controls',
      items: [
        { icon: '1️⃣', label: 'Pick strategy', text: 'Switch between First / Best / Worst Fit using the tabs. The active strategy drives the step-by-step animation.' },
        { icon: '▶',   label: 'Run → Play',    text: 'Generates steps. Use Play or Step → to watch the allocator scan blocks and assign memory.' },
      ],
    },
  ],
}

const STRATEGY_META = {
  firstFit: { label: 'First Fit',  color: '#06b6d4', border: 'border-cyan-500/40',   bg: 'bg-cyan-500/8',    text: 'text-cyan-400',   code: FIRST_FIT_CODE },
  bestFit:  { label: 'Best Fit',   color: '#22c55e', border: 'border-green-500/40',  bg: 'bg-green-500/8',   text: 'text-green-400',  code: BEST_FIT_CODE  },
  worstFit: { label: 'Worst Fit',  color: '#f43f5e', border: 'border-red-500/40',    bg: 'bg-red-500/8',     text: 'text-red-400',    code: WORST_FIT_CODE },
}

const TOTAL_MEMORY = 1700  // sum of DEFAULT_BLOCKS

function MemoryBar({ blocks, step, meta }) {
  const renderBlocks = step ? step.blocks : blocks.map(b => ({ ...b, free: true, allocatedTo: null }))
  const totalSize = renderBlocks.reduce((a, b) => a + b.size, 0)

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex w-full h-10 rounded-lg overflow-hidden border border-os-border">
        {renderBlocks.map((block, i) => {
          const pct = (block.size / totalSize) * 100
          const isChosen = step?.chosenIdx === i
          const isHighlighted = step?.highlight?.includes(i)
          return (
            <motion.div
              key={i}
              animate={isChosen ? { scaleY: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.3 }}
              className="relative flex items-center justify-center border-r border-os-bg last:border-r-0 overflow-hidden"
              style={{
                width: `${pct}%`,
                background: block.free
                  ? isHighlighted
                    ? (isChosen ? meta.color + '40' : meta.color + '18')
                    : '#0a0f1a'
                  : meta.color + '30',
                borderLeft: isChosen ? `2px solid ${meta.color}` : undefined,
              }}
            >
              {isChosen && (
                <div className="absolute inset-0" style={{ background: meta.color + '25' }} />
              )}
              <span className="text-[9px] font-mono text-gray-600 relative z-10 select-none">
                {block.size}K
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Block details row */}
      <div className="flex w-full">
        {renderBlocks.map((block, i) => {
          const pct = (block.size / totalSize) * 100
          const isChosen = step?.chosenIdx === i
          return (
            <div
              key={i}
              className="text-center overflow-hidden"
              style={{ width: `${pct}%` }}
            >
              {!block.free && (
                <span className="text-[9px] font-mono block" style={{ color: meta.color }}>
                  {block.allocatedTo}
                </span>
              )}
              {block.free && isChosen && (
                <span className="text-[9px] font-mono block" style={{ color: meta.color }}>
                  ← alloc
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StrategyPanel({ strategyKey, steps, currentStep }) {
  const meta = STRATEGY_META[strategyKey]
  const step = steps[currentStep] ?? null
  const faults = steps.slice(0, currentStep + 1).filter(s => s.result === 'fail').length
  const success = steps.slice(0, currentStep + 1).filter(s => s.result === 'success').length

  return (
    <div className={`rounded-xl border ${meta.border} p-4 space-y-3`} style={{ background: meta.color + '06' }}>
      <div className="flex items-center justify-between">
        <span className={`font-bold text-sm ${meta.text}`}>{meta.label}</span>
        <div className="flex gap-2 text-xs font-mono">
          <span className="text-green-400">{success} alloc</span>
          <span className="text-red-400">{faults} fail</span>
        </div>
      </div>

      <MemoryBar
        blocks={DEFAULT_BLOCKS}
        step={step}
        meta={meta}
      />

      {/* Step event badge */}
      <AnimatePresence mode="wait">
        {step && (
          <motion.div
            key={`${currentStep}-${strategyKey}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg text-center
              ${step.result === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : step.result === 'fail'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : `border text-gray-400 bg-os-bg`}
              `}
            style={step.result === 'scanning' ? { borderColor: meta.color + '40' } : {}}
          >
            {step.result === 'scanning' ? `Scanning ${step.highlight?.length ?? 0} candidate(s)…`
              : step.result === 'success' ? `✓ Allocated ${step.reqSize} KB → Block ${step.chosenIdx}`
              : `✗ ${step.reqSize} KB — no block large enough`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MemoryAllocation() {
  const [strategy, setStrategy] = useState('firstFit')
  const { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed } = usePlayer()

  const allResults = useMemo(
    () => runMemoryAllocation(DEFAULT_BLOCKS, DEFAULT_REQUESTS),
    []
  )

  function handleRun() {
    reset(allResults[strategy])
  }

  function switchStrategy(s) {
    setStrategy(s)
    reset([])
  }

  const step = steps[currentStep] ?? null
  const meta = STRATEGY_META[strategy]

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Memory Allocation</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Watch First Fit, Best Fit, and Worst Fit allocate memory blocks for incoming requests.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Strategy tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {Object.entries(STRATEGY_META).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchStrategy(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${strategy === key
                ? ''
                : 'bg-os-surface border-os-border text-gray-400 hover:text-white'}`}
            style={strategy === key ? {
              background: m.color + '20',
              borderColor: m.color,
              color: m.color,
            } : {}}
          >
            {m.label}
          </button>
        ))}
        <button
          onClick={handleRun}
          className="ml-auto px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Run Simulation
        </button>
      </div>

      {/* Setup info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-2">
          <div className="text-xs font-mono text-gray-600 uppercase tracking-widest">Memory Blocks</div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_BLOCKS.map((b, i) => (
              <div key={i} className="text-xs font-mono px-2 py-1 rounded bg-os-bg border border-os-border text-gray-400">
                Block {i}: <span className="text-white">{b.size} KB</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-600">Total: {TOTAL_MEMORY} KB</div>
        </div>
        <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-2">
          <div className="text-xs font-mono text-gray-600 uppercase tracking-widest">Requests</div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_REQUESTS.map((r, i) => (
              <div key={i} className="text-xs font-mono px-2 py-1 rounded bg-os-bg border border-os-border text-gray-400">
                P{i + 1}: <span className="text-white">{r} KB</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
        {/* Left — visualizer */}
        <div className="space-y-4">
          {/* Side-by-side comparison bars (always visible for context) */}
          <div className="space-y-3">
            {Object.entries(STRATEGY_META).map(([key, m]) => (
              <div key={key} className={`rounded-xl border p-3 transition-all ${key === strategy ? m.border : 'border-os-border opacity-60'}`}>
                <div className={`text-xs font-mono mb-2 ${key === strategy ? m.text : 'text-gray-600'}`}>{m.label}</div>
                <StrategyPanel
                  strategyKey={key}
                  steps={allResults[key]}
                  currentStep={steps.length > 0 && key === strategy ? currentStep : -1}
                />
              </div>
            ))}
          </div>

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

          {/* Step explanation + Why */}
          {step && (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3"
            >
              {step.reqSize && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-gray-600">Request</span>
                  <span className={`font-bold px-2 py-0.5 rounded border ${meta.border}`} style={{ color: meta.color }}>
                    {step.reqSize} KB
                  </span>
                  <span className="text-gray-600 ml-1">→</span>
                  <span className="text-gray-400">Process P{(step.requestIdx ?? 0) + 1}</span>
                </div>
              )}
              <p className="text-sm text-gray-200">{step.explanation}</p>
              <div className="border-t border-os-border pt-3">
                <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest">Why?</span>
                <p className="text-sm text-gray-400 mt-1">{step.why}</p>
              </div>
              <AIExplainer
                algorithm={`${meta.label} Memory Allocation`}
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
            code={meta.code}
            highlightLine={step?.highlightLine ?? -1}
            annotations={ANNOTATIONS[strategy] ?? {}}
          />

          {/* Algorithm comparison */}
          <div className="bg-os-surface border border-os-border rounded-xl p-4 text-xs space-y-3">
            <div className="text-gray-400 font-medium">When to Use Each</div>
            {[
              { key: 'firstFit', desc: 'Fastest — stops at the first fit. Good when speed matters more than fragmentation.' },
              { key: 'bestFit',  desc: 'Minimizes wasted space per request. Leaves smallest leftover fragments.' },
              { key: 'worstFit', desc: 'Leaves largest fragments — hopes future requests can fit the remainders.' },
            ].map(item => {
              const m = STRATEGY_META[item.key]
              return (
                <div key={item.key} className="space-y-0.5">
                  <span className={`font-mono font-bold ${m.text}`}>{m.label}</span>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
