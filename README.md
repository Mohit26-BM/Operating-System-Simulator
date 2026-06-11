# OSSim — OS Concepts Visualizer

An interactive simulator for core Operating Systems concepts, built with **Vite 5 + React 19**, **Tailwind CSS v4**, and **Framer Motion**.

---

## Tech Stack

| Layer | Library | Version |
| --- | --- | --- |
| Build | Vite | 8 |
| UI | React | 19 |
| Styling | Tailwind CSS v4 (CSS `@theme`) | 4 |
| Animation | Framer Motion | 12 |
| Routing | React Router | 7 |
| AI explanations | Groq SDK (`llama-3` via API) | 1 |

---

## Project Structure

```text
src/
├── pages/              # One page component per simulator
├── components/
│   ├── shared/         # Navbar, Controls, CodePanel, AIExplainer, SimHelp
│   ├── scheduling/     # GanttChart, ProcessForm, ProcessTable, MetricsPanel
│   ├── paging/         # MemoryGrid, PageTable, TLBCache, AddressTranslator
│   ├── disk/           # DiskTrack
│   └── deadlock/       # BankersTable, NeedMatrix
├── simulation/         # Pure JS step engines (no React)
│   ├── scheduling/     # fcfs, sjf, roundRobin, priority
│   ├── paging/         # fifo, lru, optimal
│   ├── disk/           # fcfs, sstf, scan, cscan
│   ├── concurrency/    # producerConsumer, diningPhilosophers, synchronization
│   ├── process/        # processState
│   ├── deadlock/       # banker
│   └── memoryAllocation.js
└── hooks/
    └── usePlayer.js    # Shared playback engine
```

---

## Core Patterns

### Step Engine

Every simulator is a pure function in `src/simulation/` that takes configuration and returns a `Step[]` array — a pre-computed snapshot of the system state at each point in time. React never owns the algorithm logic.

```js
// Example shape from src/simulation/scheduling/fcfs.js
steps.push({ time, running, queue, gantt, explanation, highlightLine })
```

Each step object carries everything the UI needs: the visual state, a plain-English `explanation`, and a `highlightLine` index for the pseudocode panel. Because steps are pre-computed, scrubbing backward is free.

### `usePlayer` Hook — `src/hooks/usePlayer.js`

Central playback engine shared by all simulators. Holds `steps[]`, `currentStep`, `playing`, and `speed`. Pages call `reset(newSteps)` to load fresh steps without any other state change. `play()` starts a `setInterval` that increments `currentStep`; `pause()` clears it. `stepForward`/`stepBack` clamp to `[0, steps.length - 1]`.

### Page Layout Pattern

Every simulator page follows the same skeleton:

```text
Header row  ←  title  +  SimHelp ? button (top-right)
Algorithm / mode selector tabs
Config panel  ←  validated inputs
Visualizer  ←  algorithm-specific component(s)
Controls  ←  play / pause / step / speed  (usePlayer)
Step explanation  +  AIExplainer
Side panel  ←  CodePanel (pseudocode with line highlight)
```

---

## Simulators — Implementation Detail

### CPU Scheduling — `/scheduling`

**Engine:** `src/simulation/scheduling/index.js` dispatches to `fcfs`, `sjf`, `roundRobin`, `priority`. Each function returns steps carrying `{ time, running, queue, gantt[], highlightLine, explanation }`.

**Visualizer:** `GanttChart` renders a growing colored block chart — each step appends or extends a block. `ProcessTable` colors rows by state (waiting / running / done). `MetricsPanel` computes turnaround, wait, and response time at the final step by walking the completed step array.

**Validation:** `ProcessForm` enforces arrival ≥ 0, burst ≥ 1, priority ≥ 1, max 8 processes (badge shows `X / 8`). Quantum is validated ≥ 1 in `Scheduling.jsx` before calling `runScheduling`.

---

### Process States — `/process-state`

**Engine:** `src/simulation/process/processState.js` — `generateProcessLifecycle(includeIO, includePreemption)` builds a deterministic step sequence based on two boolean flags. Steps carry `{ state, transition, explanation, highlightLine }`.

**Visualizer:** `StateDiagram` is a pure JSX layout of `StateNode` and `Arrow` components. `StateNode` uses `motion.div` to scale up when it matches `currentState`. `Arrow` highlights in cyan when its transition appears in `visitedTransitions` (computed by slicing `steps[0..currentStep]`). A scrollable transition log shows each `step.transition` string as the cursor advances.

---

### Synchronization — `/synchronization`

**Engine:** `src/simulation/concurrency/synchronization.js` exports two generators: `raceConditionSteps()` and `mutexSteps()`. Each step carries `{ shared, tempA, tempB, lockOwner, threadAState, threadBState, event, explanation, why, highlightLine }`.

**Visualizer:** A three-column grid — `ThreadLane` | center (`SharedMemory` + optional `MutexLock`) | `ThreadLane`. Thread border color and background switch reactively via the `THREAD_COLORS` map keyed by `threadAState`/`threadBState`. `ResultBanner` uses `AnimatePresence` to slide in on `event === 'race-bug'` or `'mutex-correct'`. A context-switch badge appears when `event === 'context-switch'`.

---

### Producer-Consumer — `/producer-consumer`

**Engine:** `src/simulation/concurrency/producerConsumer.js` — `simulateProducerConsumer(bufferSize, stepCount)` generates a random sequence of produce/consume operations. Each step: `{ buffer[], empty, mutex, full, actor, action, explanation, highlightLine }`.

**Visualizer:** Three `SemaphoreDisplay` boxes render semaphore values with dot-grid indicators (filled dots = current value). The buffer renders as a flex row of slots; slots with items pulse via Framer Motion `animate={{ scale: [1, 1.1, 1] }}` on insertion. Validation enforces bufferSize 2–8 and stepCount 4–30.

---

### Dining Philosophers — `/dining-philosophers`

**Engine:** `src/simulation/concurrency/diningPhilosophers.js` — `simulateDining(rounds)` uses a resource-hierarchy solution. Steps carry `{ states[5], forks[5], actor, explanation, highlightLine }`.

**Visualizer:** A circular SVG. Philosopher positions use `polarToCart(angle, r)` with angle `= (i × 360/5) − 90°`; forks are placed at the midpoint angle between each pair. Fork circles animate `fill` color when `forks[i]` is truthy. The active philosopher's circle radius expands with `motion.circle animate={{ r: isActor ? 24 : 22 }}`. A state table below shows all five philosophers each step.

---

### Memory & Paging — `/paging`

**Engine:** `src/simulation/paging/index.js` wraps the three replacement engines. Steps carry `{ page, memory[], event, evicted, tlb[], pageTable{}, highlightLine, explanation }`.

**Visualizer:** Four sub-components update from the same `step` prop in lockstep: `AddressTranslator` (virtual → physical path), `TLBCache` (fast-path lookup result), `PageTable` (full mapping table), `MemoryGrid` (frame slots with page labels). Hit/fault events are shown with green/red badges.

---

### Page Replacement — `/page-replacement`

**Engine:** Reuses `fifo`, `lru`, `optimal` from `src/simulation/paging/`. All three are computed once per input change via `useMemo`. A single `cursor` integer (not `usePlayer`) indexes all three simultaneously so they always advance in lockstep.

**Visualizer:** Three `AlgoColumn` components side-by-side, each with its own `FrameGrid` and live fault-rate progress bar. The reference string tape highlights the current index with `motion.div animate={{ scale: 1.2 }}`. A summary table appears when `cursor === maxStep`.

---

### Memory Allocation — `/memory-allocation`

**Engine:** `src/simulation/memoryAllocation.js` — `runMemoryAllocation(blocks, requests)` runs all three strategies in one call and returns `{ firstFit: steps[], bestFit: steps[], worstFit: steps[] }`. Each step: `{ reqSize, blocks[], chosenIdx, highlight[], result, explanation, why, highlightLine }`.

**Visualizer:** `MemoryBar` renders a proportional flex bar where each block's `width` is `(block.size / totalSize) * 100%`. The chosen block gets a colored left border and background. Three `StrategyPanel` components are always visible for context; only the active strategy is driven by `usePlayer`. Strategies other than the active one are rendered at `currentStep = -1` (initial state).

---

### Deadlock — Banker's Algorithm — `/deadlock`

**Engine:** `src/simulation/deadlock/banker.js` — `runBankers({ allocation, max, available, processes, resources })` computes `Need = Max − Allocation` and runs the safety algorithm to find a safe sequence. Returns `{ safe, sequence, need[][], work[] }`.

**Visualizer:** `BankersTable` owns all matrix state (Allocation, Maximum, Available inputs). On "Check Safety", it validates `allocation[i][j] ≤ max[i][j]` for every cell — invalid cells highlight red with a tooltip. `NeedMatrix` renders the computed Need matrix from the result object. A colored `motion.div` banner shows the safe sequence or an unsafe warning.

---

### Disk Scheduling — `/disk`

**Engine:** `src/simulation/disk/` — four separate files (`fcfs`, `sstf`, `scan`, `cscan`), each returning steps with `{ position, total, visited[], explanation, highlightLine }`.

**Visualizer:** `DiskTrack` draws a horizontal cylinder ruler. The head path is built as an SVG `<polyline>` that grows by one segment per step. Total seek distance accumulates in a stat chip. Validation enforces head position 0–199 and all request values 0–199.

---

### Threads vs Processes — `/threads-vs-processes`

No simulation engine — purely informational with two tabbed views:

**Memory Diagram:** `ProcessDiagram` renders a border-outlined process shell. Memory regions (Code, Heap, Global Data = shared; Stack T1/T2/T3 = private) are colored cards inside the shell. Thread buttons are clickable — selecting one expands an `AnimatePresence` panel listing its private CPU state (PC, SP, registers, stack frame). `MultiProcessDiagram` shows three isolated processes each with their own Code/Heap/Stack and an IPC labels row.

**Comparison Table:** Maps the `DIFFERENCES` array through a three-column `motion.div` grid with staggered `transition={{ delay: i * 0.06 }}` entrance animation.

---

## Shared Components

### `SimHelp` — `src/components/shared/SimHelp.jsx`

Slide-in `?` help panel. A fixed button in the page header triggers `AnimatePresence` with a spring `x` animation from the right edge (`initial={{ x: 340 }}`). Takes `title` and `sections[{ heading, items[{ icon, label, text }] }]`. A semi-transparent backdrop closes the panel on click.

### `CodePanel` — `src/components/shared/CodePanel.jsx`

Renders pseudocode as a numbered line list. The line at index `highlightLine` gets a cyan left border and tinted background. Optional `annotations` (`Record<number, string>`) render beside specific lines as small dimmed notes.

### `AIExplainer` — `src/components/shared/AIExplainer.jsx`

On demand, calls `groq-sdk` with the current step's context (algorithm name, step explanation, step index / total). API key from `import.meta.env.VITE_GROQ_API_KEY` (`.env.local`, never committed). Streams the response into a `<p>` rendered below the step explanation.

### `Controls` — `src/components/shared/Controls.jsx`

Reusable transport bar. Renders a progress indicator, Back / Play / Pause / Forward buttons, and a speed dropdown (0.5× – 4×). Wired directly to `usePlayer` values passed as props.

---

## Routing

`App.jsx` wraps all routes in `AppLayout`, which reads `useLocation` to hide `<Navbar>` when `pathname === '/'`. The home page runs its own full-screen animated hero.

```text
/                     → Home
/scheduling           → CPU Scheduling
/process-state        → Process States
/synchronization      → Synchronization
/producer-consumer    → Producer-Consumer
/dining-philosophers  → Dining Philosophers
/paging               → Memory & Paging
/page-replacement     → Page Replacement
/memory-allocation    → Memory Allocation
/disk                 → Disk Scheduling
/threads-vs-processes → Threads vs Processes
/deadlock             → Deadlock (Banker's Algorithm)
```

The `<Navbar>` groups all 11 routes into three dropdown menus — **CPU & Process**, **Concurrency**, **Memory** — to fit within the header without overflow.

---

## Theme

Defined in `src/index.css` via Tailwind v4 `@theme` (CSS custom properties):

```css
--color-os-bg:      #030712   /* page background  */
--color-os-surface: #0f1117   /* card backgrounds */
--color-os-border:  #1a2433   /* borders          */
--color-os-purple:  #06b6d4   /* accent cyan      */
--color-os-blue:    #06b6d4   /* accent cyan      */
--color-os-green:   #22c55e
--color-os-amber:   #eab308
--color-os-red:     #f43f5e
--color-os-muted:   #64748b
```

Components use `bg-os-surface`, `border-os-border`, `text-os-muted`, etc. as utility classes.

---

## Running Locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
```

`.env.local` (not committed — required for AI explanations):

```env
VITE_GROQ_API_KEY=your_key_here
```
