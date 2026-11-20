import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PhotoHero from '../components/PhotoHero'
import HeroGantt from '../components/HeroGantt'

// ── Mini SVG previews ─────────────────────────────────────────────────────────

const SW = 200, SH = 80

function PrevScheduling() {
  const bars = [
    { name: 'P1', x: 0,   w: 36, color: '#6dffb0' },
    { name: 'P2', x: 36,  w: 50, color: '#9ae870' },
    { name: 'P1', x: 86,  w: 28, color: '#6dffb0' },
    { name: 'P3', x: 114, w: 42, color: '#ffd166' },
    { name: 'P2', x: 156, w: 44, color: '#9ae870' },
  ]
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <rect x={0} y={18} width={SW} height={28} rx={3} fill="#0a110d" stroke="#1c3226" strokeWidth={0.5} />
      {bars.map((b, i) => (
        <g key={i}>
          <rect x={b.x + 1} y={19} width={b.w - 2} height={26} rx={2} fill={b.color + '28'} stroke={b.color} strokeWidth={1} />
          {b.w > 20 && (
            <text x={b.x + b.w / 2} y={35} textAnchor="middle" fontSize={8} fill={b.color} fontFamily="monospace">{b.name}</text>
          )}
        </g>
      ))}
      <text x={4} y={60} fontSize={7} fill="#52695b" fontFamily="monospace">CPU  ───────────────  time →</text>
    </svg>
  )
}

function PrevPaging() {
  const frames = [
    { label: '3', hit: true  }, { label: '1', hit: true  }, { label: '4', hit: false },
    { label: '1', hit: true  }, { label: '5', hit: false }, { label: '9', hit: true  },
    { label: '2', hit: true  }, { label: '6', hit: false },
  ]
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <text x={4} y={13} fontSize={8} fill="#52695b" fontFamily="monospace">Page Frames</text>
      {frames.map((f, i) => (
        <g key={i}>
          <rect x={4 + i * 24} y={18} width={20} height={26} rx={2}
            fill={f.hit ? '#06b6d422' : '#f43f5e18'}
            stroke={f.hit ? '#6dffb0' : '#ff6b6b'}
            strokeWidth={1} />
          <text x={14 + i * 24} y={34} textAnchor="middle" fontSize={9} fill={f.hit ? '#6dffb0' : '#ff6b6b'} fontFamily="monospace">{f.label}</text>
        </g>
      ))}
      <text x={4}  y={58} fontSize={7} fill="#6dffb0" fontFamily="monospace">● Hit</text>
      <text x={44} y={58} fontSize={7} fill="#ff6b6b" fontFamily="monospace">● Page Fault</text>
    </svg>
  )
}

function PrevDeadlock() {
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <defs>
        <marker id="dl-arr" markerWidth={5} markerHeight={5} refX={4} refY={2.5} orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill="#52695b" />
        </marker>
      </defs>
      {/* Processes */}
      <circle cx={36} cy={22} r={13} fill="#0a110d" stroke="#ff6b6b" strokeWidth={1.5} />
      <text x={36} y={26} textAnchor="middle" fontSize={9} fill="#ff6b6b" fontFamily="monospace">P1</text>
      <circle cx={36} cy={60} r={13} fill="#0a110d" stroke="#ff6b6b" strokeWidth={1.5} />
      <text x={36} y={64} textAnchor="middle" fontSize={9} fill="#ff6b6b" fontFamily="monospace">P2</text>
      {/* Resources */}
      <rect x={96} y={9}  width={28} height={22} rx={3} fill="#0a110d" stroke="#ffd166" strokeWidth={1.5} />
      <text x={110} y={23} textAnchor="middle" fontSize={8} fill="#ffd166" fontFamily="monospace">R1</text>
      <rect x={96} y={49} width={28} height={22} rx={3} fill="#0a110d" stroke="#ffd166" strokeWidth={1.5} />
      <text x={110} y={63} textAnchor="middle" fontSize={8} fill="#ffd166" fontFamily="monospace">R2</text>
      {/* Edges */}
      <line x1={49} y1={20} x2={96} y2={18}  stroke="#f43f5e88" strokeWidth={1} markerEnd="url(#dl-arr)" />
      <line x1={96} y1={30} x2={49} y2={54}  stroke="#eab30888" strokeWidth={1} markerEnd="url(#dl-arr)" />
      <line x1={49} y1={62} x2={96} y2={62}  stroke="#f43f5e88" strokeWidth={1} markerEnd="url(#dl-arr)" />
      <line x1={96} y1={50} x2={49} y2={28}  stroke="#eab30888" strokeWidth={1} markerEnd="url(#dl-arr)" />
      <text x={148} y={35} textAnchor="middle" fontSize={9} fill="#ff6b6b" fontFamily="monospace">DEAD</text>
      <text x={148} y={48} textAnchor="middle" fontSize={9} fill="#ff6b6b" fontFamily="monospace">LOCK</text>
    </svg>
  )
}

function PrevDisk() {
  const cylinders = [53, 98, 183, 37, 122, 14, 124, 65]
  const pts = cylinders.map((c, i) => ({
    x: 8 + (c / 200) * (SW - 16),
    y: 10 + i * 8,
  }))
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <text x={4} y={8} fontSize={7} fill="#52695b" fontFamily="monospace">Cylinder  0 ──────────────── 199</text>
      <path d={d} fill="none" stroke="#6dffb0" strokeWidth={1.5} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5}
          fill={i === 0 ? '#6dffb0' : '#9ae870'} />
      ))}
      <text x={4} y={76} fontSize={7} fill="#52695b" fontFamily="monospace">SSTF head movement</text>
    </svg>
  )
}

function PrevProcessState() {
  const states = [
    { label: 'New',   x: 6,   y: 32 },
    { label: 'Ready', x: 54,  y: 12 },
    { label: 'Run',   x: 110, y: 12 },
    { label: 'Wait',  x: 110, y: 52 },
    { label: 'Done',  x: 158, y: 32 },
  ]
  const edges = [[0,1],[1,2],[2,3],[3,1],[2,4]]
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <defs>
        <marker id="ps-arr" markerWidth={5} markerHeight={5} refX={4} refY={2.5} orient="auto">
          <path d="M0,0 L5,2.5 L0,5 Z" fill="#2c4237" />
        </marker>
      </defs>
      {edges.map(([a, b], i) => {
        const s = states[a], t = states[b]
        return <line key={i} x1={s.x + 16} y1={s.y + 8} x2={t.x + 16} y2={t.y + 8} stroke="#1c3226" strokeWidth={1} markerEnd="url(#ps-arr)" />
      })}
      {states.map((s, i) => (
        <g key={i}>
          <rect x={s.x} y={s.y} width={32} height={16} rx={8}
            fill={i === 2 ? '#06b6d422' : '#0a110d'}
            stroke={i === 2 ? '#6dffb0' : '#1c3226'}
            strokeWidth={i === 2 ? 1.5 : 1} />
          <text x={s.x + 16} y={s.y + 11} textAnchor="middle" fontSize={7}
            fill={i === 2 ? '#6dffb0' : '#52695b'} fontFamily="monospace">{s.label}</text>
        </g>
      ))}
    </svg>
  )
}

function PrevProducerConsumer() {
  const slots = [1, 1, 1, 0, 0, 0, 0, 0]
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <text x={16} y={13} fontSize={8} fill="#9ae870" fontFamily="monospace">PROD</text>
      <text x={152} y={13} fontSize={8} fill="#ff6b6b" fontFamily="monospace">CONS</text>
      <line x1={36} y1={16} x2={52} y2={34} stroke="#9ae870" strokeWidth={1.5} />
      <line x1={158} y1={16} x2={150} y2={34} stroke="#ff6b6b" strokeWidth={1.5} />
      {slots.map((filled, i) => (
        <rect key={i} x={50 + i * 13} y={34} width={11} height={20} rx={2}
          fill={filled ? '#22c55e28' : '#0a110d'}
          stroke={filled ? '#9ae870' : '#1c3226'}
          strokeWidth={1} />
      ))}
      <text x={SW / 2} y={68} textAnchor="middle" fontSize={7} fill="#52695b" fontFamily="monospace">Bounded Buffer  [3 / 8 full]</text>
    </svg>
  )
}

function PrevSynchronization() {
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      {/* Thread A lane */}
      <rect x={4} y={8} width={78} height={28} rx={4} fill="#0a110d" stroke="#6dffb0" strokeWidth={1.5} />
      <text x={43} y={19} textAnchor="middle" fontSize={8} fill="#6dffb0" fontFamily="monospace" fontWeight="bold">Thread A</text>
      <text x={43} y={30} textAnchor="middle" fontSize={7} fill="#52695b" fontFamily="monospace">temp = 0</text>
      {/* Thread B lane */}
      <rect x={118} y={8} width={78} height={28} rx={4} fill="#0a110d" stroke="#ff6b6b" strokeWidth={1.5} />
      <text x={157} y={19} textAnchor="middle" fontSize={8} fill="#ff6b6b" fontFamily="monospace" fontWeight="bold">Thread B</text>
      <text x={157} y={30} textAnchor="middle" fontSize={7} fill="#52695b" fontFamily="monospace">temp = 0</text>
      {/* Shared memory */}
      <rect x={84} y={10} width={30} height={24} rx={4} fill="#0a110d" stroke="#ff6b6b" strokeWidth={1.5} />
      <text x={99} y={21} textAnchor="middle" fontSize={7} fill="#6f8a7b" fontFamily="monospace">shared</text>
      <text x={99} y={30} textAnchor="middle" fontSize={9} fill="#ff6b6b" fontFamily="monospace" fontWeight="bold">1</text>
      {/* Race label */}
      <text x={SW/2} y={52} textAnchor="middle" fontSize={8} fill="#ff6b6b" fontFamily="monospace">⚠ RACE CONDITION</text>
      <text x={SW/2} y={63} textAnchor="middle" fontSize={7} fill="#52695b" fontFamily="monospace">Expected 2 — Got 1</text>
      {/* Mutex version */}
      <rect x={62} y={68} width={12} height={12} rx={2} fill="#ffd166" opacity={0.6} />
      <text x={78} y={77} fontSize={7} fill="#ffd166" fontFamily="monospace">🔒 mutex fixes this</text>
    </svg>
  )
}

function PrevPageReplacement() {
  const algos = [
    { label: 'FIFO', faults: 9, color: '#6dffb0' },
    { label: 'LRU',  faults: 8, color: '#9ae870' },
    { label: 'OPT',  faults: 5, color: '#b4a7ff' },
  ]
  const maxF = 9
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <text x={SW/2} y={11} textAnchor="middle" fontSize={7} fill="#52695b" fontFamily="monospace">Page Faults Comparison  (3 frames)</text>
      {algos.map((a, i) => {
        const x = 18 + i * 60, barH = (a.faults / maxF) * 40, y = 55 - barH
        return (
          <g key={a.label}>
            <rect x={x} y={y} width={40} height={barH} rx={2} fill={a.color + '30'} stroke={a.color} strokeWidth={1} />
            <text x={x+20} y={y - 3} textAnchor="middle" fontSize={8} fill={a.color} fontFamily="monospace" fontWeight="bold">{a.faults}</text>
            <text x={x+20} y={66} textAnchor="middle" fontSize={8} fill={a.color} fontFamily="monospace">{a.label}</text>
          </g>
        )
      })}
      <text x={SW/2} y={78} textAnchor="middle" fontSize={7} fill="#52695b" fontFamily="monospace">Optimal is theoretical minimum</text>
    </svg>
  )
}

function PrevThreads() {
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      {/* Process box */}
      <rect x={4} y={4} width={SW-8} height={SH-8} rx={6} fill="#0a110d" stroke="#6dffb0" strokeWidth={1.5} strokeDasharray="4 2" />
      <text x={SW/2} y={16} textAnchor="middle" fontSize={8} fill="#6dffb0" fontFamily="monospace">Process (shared memory)</text>
      {/* Shared regions */}
      {[{ label:'Code', color:'#6dffb0' },{ label:'Heap', color:'#9ae870' },{ label:'Data', color:'#b4a7ff' }].map((r,i) => (
        <g key={r.label}>
          <rect x={10 + i*58} y={20} width={50} height={16} rx={3} fill={r.color+'20'} stroke={r.color} strokeWidth={1} />
          <text x={35 + i*58} y={31} textAnchor="middle" fontSize={8} fill={r.color} fontFamily="monospace">{r.label}</text>
        </g>
      ))}
      {/* Thread stacks */}
      {[{label:'T1',color:'#ffb454'},{label:'T2',color:'#ff6b6b'},{label:'T3',color:'#ff8fb8'}].map((t,i) => (
        <g key={t.label}>
          <rect x={10 + i*62} y={42} width={52} height={22} rx={3} fill={t.color+'15'} stroke={t.color} strokeWidth={1} />
          <text x={36 + i*62} y={52} textAnchor="middle" fontSize={8} fill={t.color} fontFamily="monospace">{t.label}</text>
          <text x={36 + i*62} y={61} textAnchor="middle" fontSize={7} fill="#52695b" fontFamily="monospace">stack</text>
        </g>
      ))}
    </svg>
  )
}

function PrevMemoryAllocation() {
  const blocks = [
    { size: 100, free: true  },
    { size: 500, free: false, label: 'P1', color: '#6dffb0' },
    { size: 200, free: true  },
    { size: 300, free: false, label: 'P2', color: '#9ae870' },
    { size: 600, free: true  },
  ]
  const total = blocks.reduce((a,b) => a+b.size,0)
  let x = 4
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <text x={SW/2} y={11} textAnchor="middle" fontSize={7} fill="#52695b" fontFamily="monospace">Memory Map  (First Fit allocated)</text>
      {blocks.map((b,i) => {
        const w = (b.size / total) * (SW-8)
        const rx = x
        x += w
        return (
          <g key={i}>
            <rect x={rx} y={16} width={w-1} height={30} rx={2}
              fill={b.free ? '#0a110d' : (b.color+'25')}
              stroke={b.free ? '#1c3226' : b.color}
              strokeWidth={b.free ? 0.5 : 1.5} />
            {!b.free && (
              <text x={rx+w/2} y={34} textAnchor="middle" fontSize={8} fill={b.color} fontFamily="monospace">{b.label}</text>
            )}
            {b.free && w > 20 && (
              <text x={rx+w/2} y={34} textAnchor="middle" fontSize={7} fill="#2c4237" fontFamily="monospace">free</text>
            )}
          </g>
        )
      })}
      <text x={4}   y={58} fontSize={7} fill="#6dffb0" fontFamily="monospace">First Fit</text>
      <text x={60}  y={58} fontSize={7} fill="#9ae870" fontFamily="monospace">Best Fit</text>
      <text x={108} y={58} fontSize={7} fill="#ff6b6b" fontFamily="monospace">Worst Fit</text>
    </svg>
  )
}

function PrevDining() {
  const n = 5
  const cx = SW / 2 - 10, cy = SH / 2, r = 26
  const philos = Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI / n) - Math.PI / 2
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), eating: i === 1 || i === 3 }
  })
  const forks = Array.from({ length: n }, (_, i) => {
    const a = ((i + 0.5) * 2 * Math.PI / n) - Math.PI / 2
    return { x: cx + (r * 0.52) * Math.cos(a), y: cy + (r * 0.52) * Math.sin(a), taken: i === 0 || i === 2 }
  })
  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-full">
      <circle cx={cx} cy={cy} r={16} fill="#0a110d" stroke="#1c3226" strokeWidth={1} />
      {forks.map((f, i) => (
        <rect key={i} x={f.x - 2} y={f.y - 5} width={4} height={10} rx={1}
          fill={f.taken ? '#ffd166' : '#1c3226'}
          transform={`rotate(${(i + 0.5) * 72}, ${f.x}, ${f.y})`} />
      ))}
      {philos.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={7}
          fill={p.eating ? '#06b6d422' : '#0a110d'}
          stroke={p.eating ? '#6dffb0' : '#52695b'}
          strokeWidth={1.5} />
      ))}
      <text x={cx + 38} y={cy - 8}  fontSize={8} fill="#6dffb0" fontFamily="monospace">eating</text>
      <text x={cx + 38} y={cy + 4}  fontSize={8} fill="#52695b" fontFamily="monospace">waiting</text>
      <text x={cx + 38} y={cy + 16} fontSize={8} fill="#ffd166" fontFamily="monospace">fork</text>
    </svg>
  )
}

// ── Sections data ─────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    label: 'Process Management',
    desc: 'Scheduling, lifecycle, and synchronization',
    modules: [
      {
        path: '/scheduling',
        title: 'CPU Scheduling',
        short: 'Who runs next?',
        desc: 'FCFS, SJF, SRTF, Round Robin, Priority (with aging) and a multilevel feedback queue, including processes that do I/O. Animated Gantt chart plus waiting, turnaround and response metrics.',
        concepts: ['SRTF', 'Preemption', 'MLFQ', 'I/O Bursts'],
        accent: '#6dffb0',
        icon: '⚙',
        Preview: PrevScheduling,
      },
      {
        path: '/process-state',
        title: 'Process States',
        short: 'A life in five states',
        desc: 'Follow a process through New → Ready → Running → Waiting → Terminated with PCB details at each transition.',
        concepts: ['PCB', 'I/O Wait', 'Preemption', 'Context Switch'],
        accent: '#7cc4ff',
        icon: '↻',
        Preview: PrevProcessState,
      },
      {
        path: '/threads-vs-processes',
        title: 'Threads vs Processes',
        short: 'Shared vs isolated memory',
        desc: 'Click any thread to see its private state. Compare shared heap/code against per-thread stacks. Then see why IPC is needed between processes.',
        concepts: ['Address Space', 'Stack', 'Context Switch', 'IPC'],
        accent: '#6dffb0',
        icon: '⊶',
        Preview: PrevThreads,
      },
      {
        path: '/producer-consumer',
        title: 'Producer-Consumer',
        short: 'Semaphore synchronization',
        desc: 'A bounded shared buffer guarded by semaphores. Watch producers block when full and consumers block when empty.',
        concepts: ['Semaphore', 'Mutex', 'Buffer', 'Synchronization'],
        accent: '#9ae870',
        icon: '⇄',
        Preview: PrevProducerConsumer,
      },
    ],
  },
  {
    label: 'Memory & Storage',
    desc: 'Allocation, translation, and I/O scheduling',
    modules: [
      {
        path: '/page-replacement',
        title: 'Page Replacement',
        short: 'FIFO vs LRU vs Optimal',
        desc: 'Enter a reference string and compare all three algorithms side-by-side. See fault counts and hit rates update in real time.',
        concepts: ['FIFO', 'LRU', 'Optimal', 'Belady\'s Anomaly'],
        accent: '#b4a7ff',
        icon: '⟳',
        Preview: PrevPageReplacement,
      },
      {
        path: '/memory-allocation',
        title: 'Memory Allocation',
        short: 'First, Best, and Worst Fit',
        desc: 'A memory bar shows how each strategy places requests differently. First Fit is fast; Best Fit minimizes waste; Worst Fit leaves large gaps.',
        concepts: ['First Fit', 'Best Fit', 'Worst Fit', 'Fragmentation'],
        accent: '#ffb454',
        icon: '▦',
        Preview: PrevMemoryAllocation,
      },
      {
        path: '/dynamic-memory',
        title: 'Dynamic Allocation',
        short: 'Splitting, merging, buddy system',
        desc: 'Variable-size requests carved from holes, freed blocks merging back, and external fragmentation building up until compaction. Includes First/Best/Worst/Next Fit and the buddy allocator.',
        concepts: ['Splitting', 'Coalescing', 'Fragmentation', 'Buddy System'],
        accent: '#4fe3b8',
        icon: '▤',
        Preview: PrevMemoryAllocation,
      },
      {
        path: '/paging',
        title: 'Memory & Paging',
        short: 'Virtual address translation',
        desc: 'Page table lookup, TLB hits and misses, and page replacement — FIFO, LRU, and Optimal compared side by side.',
        concepts: ['FIFO', 'LRU', 'Optimal', 'TLB'],
        accent: '#4fe3b8',
        icon: '▦',
        Preview: PrevPaging,
      },
      {
        path: '/disk',
        title: 'Disk Scheduling',
        short: 'Minimize head movement',
        desc: 'Watch the disk head sweep across cylinders. FCFS, SSTF, SCAN and C-SCAN — seek distance shown live.',
        concepts: ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'],
        accent: '#ffb454',
        icon: '◎',
        Preview: PrevDisk,
      },
    ],
  },
  {
    label: 'Concurrency & Safety',
    desc: 'Classic problems in mutual exclusion',
    modules: [
      {
        path: '/synchronization',
        title: 'Process Synchronization',
        short: 'Race conditions & mutexes',
        desc: 'Two threads, one counter. Without a mutex: lost update. With a mutex: correct. See exactly why at each CPU instruction.',
        concepts: ['Race Condition', 'Mutex', 'Critical Section', 'Atomicity'],
        accent: '#ff6b6b',
        icon: '⚡',
        Preview: PrevSynchronization,
      },
      {
        path: '/dining-philosophers',
        title: 'Dining Philosophers',
        short: 'Five forks, five hungry philosophers',
        desc: 'The canonical concurrency problem. Five philosophers share five forks — see deadlock and starvation emerge.',
        concepts: ['Deadlock', 'Starvation', 'Fork Ownership', 'Mutex'],
        accent: '#b4a7ff',
        icon: '◌',
        Preview: PrevDining,
      },
      {
        path: '/deadlock',
        title: 'Deadlock Detection',
        short: "Banker's algorithm",
        desc: "Banker's algorithm. Enter the allocation and maximum matrices, follow how the safe sequence is found step by step, and test whether a new request can be granted safely.",
        concepts: ["Banker's", 'Need Matrix', 'Safe State', 'Resource Request'],
        accent: '#ff6b6b',
        icon: '⛔',
        Preview: PrevDeadlock,
      },
    ],
  },
]

// ── Card component ────────────────────────────────────────────────────────────

function ModuleCard({ m, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      transition={{ duration: 0.45, delay: i * 0.07, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <Link
        to={m.path}
        className="group relative flex flex-col bg-os-surface border border-os-border rounded-2xl overflow-hidden hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-1.5 h-full"
      >
        {/* Top bar */}
        <div className="flex items-start justify-end p-5 pb-0">
          <span className="text-os-muted group-hover:text-white group-hover:translate-x-1.5 text-xl transition-all duration-300 leading-none mt-1">›</span>
        </div>

        {/* Content */}
        <div className="px-5 pb-4 flex-1 -mt-2">
          <p className="text-xs font-mono mb-1" style={{ color: m.accent }}>{m.short}</p>
          <h2 className="text-white font-semibold text-base mb-2">{m.title}</h2>
          <p className="text-os-muted text-sm leading-relaxed mb-4">{m.desc}</p>
          <div className="flex flex-wrap gap-1.5">
            {m.concepts.map(c => (
              <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5">{c}</span>
            ))}
          </div>
        </div>

        {/* SVG preview strip */}
        <div className="border-t border-os-border bg-os-bg/60 h-20 overflow-hidden">
          <m.Preview />
        </div>
      </Link>
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Home() {
  const totalModules = SECTIONS.reduce((s, sec) => s + sec.modules.length, 0)

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-16">

      {/* Hero: photographs (Pexels, green duotone) with the real Round Robin scheduler running live */}
      <div className="pt-8">
        <PhotoHero>
          <div className="hero-text space-y-6 max-w-2xl">
            <div className="space-y-3">
              <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">OS Simulator</span>
              <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                See the OS<br />
                <span className="text-cyan-400 caret">Work Live</span>
              </h1>
            </div>
            <p className="text-gray-200 text-lg leading-relaxed max-w-md">
              Step-by-step visualizations of core Operating System algorithms.
              Every concept is animated with pseudocode sync and AI explanations.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                `${totalModules} modules`,
                'Step-by-step playback',
                'AI explanations',
                'Pseudocode sync',
              ].map(t => (
                <span key={t} className="px-3 py-1 rounded-full bg-os-surface/70 backdrop-blur-sm border border-os-border text-sm text-gray-300">
                  {t}
                </span>
              ))}
            </div>
            <HeroGantt />
            <Link
              to="/scheduling"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 text-os-bg font-semibold text-sm hover:bg-cyan-400 transition-colors"
            >
              Start with CPU Scheduling ›
            </Link>
          </div>
        </PhotoHero>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => (
        <motion.section
          key={section.label}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '0px 0px -80px 0px' }}
          transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">{section.label}</h2>
              <p className="text-xs text-os-muted mt-0.5">{section.desc}</p>
            </div>
            <div className="flex-1 h-px bg-os-border" />
            <span className="text-sm text-os-muted whitespace-nowrap">
              {section.modules.length} module{section.modules.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {section.modules.map((m, mi) => (
              <ModuleCard key={m.path} m={m} i={mi} />
            ))}
          </div>
        </motion.section>
      ))}

      <div className="pb-16" />
    </div>
  )
}
