import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SimHelp from '../components/shared/SimHelp'

const HELP = {
  title: 'Threads vs Processes',
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: 'How threads share an address space within a process, versus separate processes that are fully isolated from each other.' }],
    },
    {
      heading: 'Views',
      items: [
        { icon: '🗺', label: 'Memory Diagram',   text: 'Shows the address space of one process with 3 threads. Click any thread to see its private CPU state (PC, stack, registers).' },
        { icon: '📊', label: 'Comparison Table', text: 'Side-by-side breakdown of Process vs Thread across memory, creation cost, communication, isolation, and context switch overhead.' },
      ],
    },
    {
      heading: 'Memory regions',
      items: [
        { icon: '🔵', label: 'Shared (cyan/green/purple)', text: 'Code segment, heap, and global data are shared by all threads in the process.' },
        { icon: '🟡', label: 'Private (amber/pink)',        text: 'Each thread has its own stack — local variables and call frames are NOT shared.' },
      ],
    },
    {
      heading: 'Key insight',
      items: [
        { icon: '⚡', label: 'Speed', text: 'Thread creation is ~10–100× faster than fork() because only a stack and register set are needed.' },
        { icon: '⚠', label: 'Risk',  text: 'Threads sharing the heap can corrupt each other\'s data in a race condition. Isolated processes cannot.' },
      ],
    },
  ],
}

const MEMORY_REGIONS = [
  { label: 'Code Segment',  desc: 'Executable instructions',     sharedByThreads: true,  color: '#6dffb0', icon: '{}' },
  { label: 'Heap',          desc: 'Dynamic allocations (malloc)', sharedByThreads: true,  color: '#9ae870', icon: '⬡' },
  { label: 'Global Data',   desc: 'Global & static variables',    sharedByThreads: true,  color: '#b4a7ff', icon: '⊞' },
  { label: 'Stack T1',      desc: 'Thread 1 local variables',     sharedByThreads: false, color: '#ffb454', icon: '▤' },
  { label: 'Stack T2',      desc: 'Thread 2 local variables',     sharedByThreads: false, color: '#ff6b6b', icon: '▤' },
  { label: 'Stack T3',      desc: 'Thread 3 local variables',     sharedByThreads: false, color: '#ff8fb8', icon: '▤' },
]

const DIFFERENCES = [
  { aspect: 'Memory',       process: 'Separate address space',         thread: 'Shared address space'           },
  { aspect: 'Creation',     process: 'Slow (fork + copy)',             thread: 'Fast (stack + registers only)'  },
  { aspect: 'Communication',process: 'IPC needed (pipe, socket, shm)', thread: 'Direct via shared memory'       },
  { aspect: 'Isolation',    process: 'Crash doesn\'t affect others',   thread: 'Crash can kill entire process'  },
  { aspect: 'Scheduling',   process: 'Scheduled independently',        thread: 'Scheduled independently'        },
  { aspect: 'Context Switch',process: 'Expensive (MMU flush)',         thread: 'Cheaper (same address space)'   },
]

const THREADS = [
  { id: 'T1', color: '#ffb454', label: 'Thread 1', state: 'Running' },
  { id: 'T2', color: '#ff6b6b', label: 'Thread 2', state: 'Ready'   },
  { id: 'T3', color: '#ff8fb8', label: 'Thread 3', state: 'Waiting' },
]

function ProcessDiagram({ activeThread, setActiveThread }) {
  return (
    <div className="bg-os-bg border border-os-border rounded-2xl p-6 space-y-4">
      {/* Process shell */}
      <div className="border-2 border-cyan-500/40 rounded-xl p-4 bg-cyan-500/5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Process (PID 1042)</span>
          <span className="ml-auto text-[10px] font-mono text-gray-600">virtual address space</span>
        </div>

        {/* Memory layout */}
        <div className="grid grid-cols-2 gap-2">
          {MEMORY_REGIONS.map(r => (
            <motion.div
              key={r.label}
              whileHover={{ scale: 1.02 }}
              className="rounded-lg border p-2 cursor-default"
              style={{
                borderColor: r.color + '60',
                background: r.color + '10',
              }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-mono" style={{ color: r.color }}>{r.icon}</span>
                <span className="text-xs font-mono font-medium" style={{ color: r.color }}>{r.label}</span>
              </div>
              <p className="text-[10px] text-gray-600">{r.desc}</p>
              {r.sharedByThreads && (
                <span className="text-[9px] font-mono text-green-500 mt-0.5 block">shared by all threads</span>
              )}
              {!r.sharedByThreads && (
                <span className="text-[9px] font-mono text-amber-500 mt-0.5 block">private per-thread</span>
              )}
            </motion.div>
          ))}
        </div>

        {/* Threads inside the process */}
        <div className="border-t border-os-border pt-3">
          <div className="text-[10px] font-mono text-gray-600 mb-2 uppercase tracking-widest">Threads</div>
          <div className="flex gap-2">
            {THREADS.map(t => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.04 }}
                onClick={() => setActiveThread(activeThread === t.id ? null : t.id)}
                className={`flex-1 rounded-lg border-2 p-2 text-left transition-all
                  ${activeThread === t.id ? 'border-opacity-100' : 'border-opacity-40'}`}
                style={{
                  borderColor: t.color,
                  background: activeThread === t.id ? t.color + '18' : t.color + '08',
                }}
              >
                <div className="text-xs font-mono font-bold" style={{ color: t.color }}>{t.id}</div>
                <div className="text-[10px] text-gray-600 mt-0.5">{t.state}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] text-gray-600 font-mono">PC</span>
                  <span className="text-[9px] font-mono" style={{ color: t.color }}>0x{(0x4005f0 + THREADS.indexOf(t) * 0x40).toString(16)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Thread detail panel */}
      <AnimatePresence>
        {activeThread && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {THREADS.filter(t => t.id === activeThread).map(t => (
              <div key={t.id} className="rounded-xl border p-4 space-y-2"
                style={{ borderColor: t.color + '50', background: t.color + '08' }}>
                <div className="text-sm font-mono font-bold" style={{ color: t.color }}>{t.label} — Private State</div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {['PC (program counter)', 'SP (stack pointer)', 'Registers (R0–R15)', 'Stack frame', 'Thread ID'].map(item => (
                    <div key={item} className="flex items-start gap-1.5">
                      <span style={{ color: t.color }} className="mt-0.5">▸</span>
                      <span className="text-gray-400">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 pt-1">
                  Each thread has its own call stack and CPU registers. Code, heap, and global data are shared with all other threads in this process.
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MultiProcessDiagram() {
  return (
    <div className="bg-os-bg border border-os-border rounded-2xl p-6 space-y-3">
      <div className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-2">Multiple Processes</div>
      {['Process A (PID 100)', 'Process B (PID 101)', 'Process C (PID 102)'].map((name) => (
        <div key={name} className="border border-os-border rounded-xl p-3 space-y-2">
          <div className="text-xs font-mono text-cyan-400">{name}</div>
          <div className="grid grid-cols-3 gap-1">
            {['Code', 'Heap', 'Stack'].map(region => (
              <div key={region} className="text-[10px] font-mono text-gray-600 bg-os-surface rounded px-2 py-1 text-center border border-os-border">
                {region}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-gray-600">Isolated address space — cannot directly read another process's memory</div>
        </div>
      ))}
      <div className="border border-os-border rounded-xl p-3 bg-os-surface">
        <div className="text-[10px] font-mono text-amber-400 mb-1">IPC mechanisms required:</div>
        <div className="flex flex-wrap gap-1">
          {['Pipe', 'Socket', 'Shared Memory', 'Message Queue', 'Signal'].map(m => (
            <span key={m} className="text-[10px] font-mono px-2 py-0.5 rounded bg-os-bg border border-os-border text-gray-500">{m}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ThreadsVsProcesses() {
  const [activeThread, setActiveThread] = useState(null)
  const [view, setView] = useState('diagram')

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Threads vs Processes</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Understand how threads share memory within a process — and why that matters for concurrency.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {[
          { id: 'diagram',     label: 'Memory Diagram'  },
          { id: 'differences', label: 'Comparison Table' },
        ].map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${view === v.id
                ? 'bg-cyan-600 text-white'
                : 'bg-os-surface border border-os-border text-gray-400 hover:text-white'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === 'diagram' && (
          <motion.div
            key="diagram"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="space-y-2">
              <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest px-1">
                Single Process — Multiple Threads
              </div>
              <ProcessDiagram activeThread={activeThread} setActiveThread={setActiveThread} />
              {activeThread && (
                <p className="text-xs text-gray-600 px-1">Click a thread to see its private state ↑</p>
              )}
              {!activeThread && (
                <p className="text-xs text-gray-600 px-1">Click a thread to inspect its private CPU state ↑</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono text-amber-400 uppercase tracking-widest px-1">
                Multiple Processes — Isolated
              </div>
              <MultiProcessDiagram />
            </div>
          </motion.div>
        )}

        {view === 'differences' && (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-os-surface border border-os-border rounded-2xl overflow-hidden"
          >
            <div className="grid grid-cols-3 bg-os-bg border-b border-os-border text-xs font-mono uppercase tracking-widest">
              <div className="px-4 py-3 text-gray-600">Aspect</div>
              <div className="px-4 py-3 text-cyan-400 border-l border-os-border">Process</div>
              <div className="px-4 py-3 text-amber-400 border-l border-os-border">Thread</div>
            </div>
            {DIFFERENCES.map((row, i) => (
              <motion.div
                key={row.aspect}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="grid grid-cols-3 border-b border-os-border/50 hover:bg-os-bg/40 transition-colors"
              >
                <div className="px-4 py-3 text-sm text-gray-400 font-mono">{row.aspect}</div>
                <div className="px-4 py-3 text-sm text-gray-300 border-l border-os-border/50">{row.process}</div>
                <div className="px-4 py-3 text-sm text-gray-300 border-l border-os-border/50">{row.thread}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key insight box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            title: 'Why Threads Are Faster to Create',
            body: 'A new thread only needs a stack and register set. A new process requires copying the full address space (or using copy-on-write). Thread creation is ~10–100× faster.',
            color: 'border-cyan-500/30 bg-cyan-500/5',
            label: 'text-cyan-400',
          },
          {
            title: 'Why Shared Memory Causes Races',
            body: 'Threads sharing the heap and globals can corrupt data if two threads write simultaneously. Processes are isolated — a bug in one cannot corrupt another\'s memory.',
            color: 'border-red-500/30 bg-red-500/5',
            label: 'text-red-400',
          },
          {
            title: 'Context Switch Cost',
            body: 'Switching between threads in the same process is cheaper: no TLB flush needed. Process context switch must reload the MMU\'s page table — a costly operation.',
            color: 'border-amber-500/30 bg-amber-500/5',
            label: 'text-amber-400',
          },
        ].map(card => (
          <div key={card.title} className={`rounded-xl border p-4 ${card.color}`}>
            <div className={`text-xs font-mono font-bold mb-2 ${card.label}`}>{card.title}</div>
            <p className="text-xs text-gray-500 leading-relaxed">{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
