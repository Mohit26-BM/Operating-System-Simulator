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
| AI explanations | Groq SDK, called from a server-side function (`/api/explain`), model `openai/gpt-oss-120b` | 1 |

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
│   ├── scheduling/     # fcfs, sjf, roundRobin, priority, advanced (SRTF, preemptive priority, MLFQ, I/O), metrics
│   ├── paging/         # fifo, lru, optimal
│   ├── disk/           # fcfs, sstf, sweep (SCAN, C-SCAN, LOOK, C-LOOK)
│   ├── concurrency/    # producerConsumer, diningPhilosophers, synchronization
│   ├── process/        # processState
│   ├── deadlock/       # banker
│   ├── memory/         # dynamic (First/Best/Worst/Next Fit), buddy
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

**Engine:** `src/simulation/scheduling/index.js` runs seven algorithms: FCFS, SJF, Round Robin and non-preemptive Priority (their own small engines), plus **SRTF**, **preemptive Priority** (with optional aging) and a **multilevel feedback queue** (MLFQ, with per-queue quanta and an optional priority boost). The preemptive algorithms, and any run where a process does I/O, use one unit-time engine (`advanced.js`). Processes can alternate CPU and I/O: write `2:3` in the I/O field and the process leaves the CPU for 3 units after 2 units of CPU, then rejoins the back of the ready queue. Steps carry `{ time, running, queue, blocked[], level?, event?, highlightLine, explanation }`; waiting time counts only time spent ready, not time spent in I/O.

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

**Engine:** `src/simulation/concurrency/diningPhilosophers.js` — `simulateDining({ strategy, rounds, schedule })` supports three strategies: **naive** (left fork then right, which can deadlock), **resource ordering** (lower-numbered fork first) and **both-or-none**. A "worst-case timing" option makes every philosopher hungry at once, which deadlocks the naive strategy; the deadlock is detected and explained. Steps carry `{ states[5], forks[5], holders[5], meals[5], actor, explanation, highlightLine, deadlock? }`.

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

### Dynamic Allocation — `/dynamic-memory`

**Engine:** `src/simulation/memory/dynamic.js` simulates a real allocator over a list of operations (`A 100`, `free A`, `compact`): a request is carved out of a hole and the rest stays free (splitting), a freed block merges with free neighbours (coalescing), and external fragmentation builds up until compaction. Strategies: First, Best, Worst and Next Fit. `buddy.js` is the buddy allocator used inside the Linux kernel: requests round up to powers of two, larger blocks split in halves, and freed buddies merge back (it reports internal fragmentation). Every step carries the full memory map plus statistics (free memory, largest hole, external fragmentation).

### Memory Allocation — `/memory-allocation`

**Engine:** `src/simulation/memoryAllocation.js` — `runMemoryAllocation(blocks, requests)` runs all three strategies in one call and returns `{ firstFit: steps[], bestFit: steps[], worstFit: steps[] }`. Each step: `{ reqSize, blocks[], chosenIdx, highlight[], result, explanation, why, highlightLine }`.

**Visualizer:** `MemoryBar` renders a proportional flex bar where each block's `width` is `(block.size / totalSize) * 100%`. The chosen block gets a colored left border and background. Three `StrategyPanel` components are always visible for context; only the active strategy is driven by `usePlayer`. Strategies other than the active one are rendered at `currentStep = -1` (initial state).

---

### Deadlock — Banker's Algorithm — `/deadlock`

**Engine:** `src/simulation/deadlock/banker.js` — `runBankers({ allocation, max, available, processes, resources })` computes `Need = Max − Allocation` and runs the safety algorithm to find a safe sequence. Returns `{ safe, sequence, need[][], trace[], stuck[] }`, where `trace` shows the available vector growing as each process finishes. `requestResources(input, pid, request)` implements the resource-request algorithm (grant only if the state stays safe).

**Visualizer:** `BankersTable` owns all matrix state (Allocation, Maximum, Available inputs). On "Check Safety", it validates `allocation[i][j] ≤ max[i][j]` for every cell — invalid cells highlight red with a tooltip. `NeedMatrix` renders the computed Need matrix from the result object. A colored `motion.div` banner shows the safe sequence or an unsafe warning.

---

### Disk Scheduling — `/disk`

**Engine:** `src/simulation/disk/` — FCFS, SSTF and four sweeping algorithms built on one engine (`sweep.js`): **SCAN** (runs to the disk edge, then reverses), **C-SCAN** (edge, wrap-around jump, same direction), **LOOK** and **C-LOOK** (turn at the last request instead of the edge). The first direction is selectable and the wrap-around jump is counted in the total. Steps carry `{ head, from, target, movement, total, remaining, serviced, direction, explanation, highlightLine }`.

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

On demand, posts the current step's text to `/api/explain` and streams the answer into a `<p>` below the step explanation. The Groq key lives only on the server side of that endpoint (`api/explain.js`, a Vercel function; the Vite dev and preview servers serve the same handler). The browser never sees the key. The endpoint accepts same-origin JSON only, validates every field, and rate limits visitors.

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
/memory-allocation    → Memory Allocation (fixed partitions)
/dynamic-memory       → Dynamic Allocation (splitting, coalescing, buddy)
/disk                 → Disk Scheduling
/threads-vs-processes → Threads vs Processes
/deadlock             → Deadlock (Banker's Algorithm)
```

The `<Navbar>` groups all 12 routes into three dropdown menus — **CPU & Process**, **Concurrency**, **Memory** — to fit within the header without overflow.

---

## Theme: Terminal

The look is a console: phosphor green on a green-black screen, JetBrains Mono for headings and numbers, Inter for body text, and a faint grid behind everything. The colours follow the states an operating system has, and they mean the same thing on every page:

| Colour | Meaning |
|---|---|
| Phosphor green `#6dffb0` | running, active, the thing to watch (the brand colour) |
| Amber `#ffb454` | ready (waiting for its turn), warnings |
| Coral `#ff6b6b` | blocked, fault, deadlock, error |
| Steel blue `#7cc4ff` | I/O and secondary series |
| Lavender `#b4a7ff` | a further series |

Everything is defined in `src/index.css` with Tailwind v4 `@theme`. Besides the named tokens (`os-bg`, `os-surface`, `os-border`, `os-muted`), Tailwind's own colour scales (cyan, emerald, green, amber, red, rose, blue, purple, gray and so on) are re-pointed to this palette, so a class such as `text-cyan-400` or `bg-gray-700` anywhere in the app already uses the Terminal colours. The Gantt chart uses eight clearly different hues with dark text on them.

### Home page hero

A banner of five photographs (a code screen, a chip, a server rack, circuit traces and a server corridor) that cross-fade slowly behind the headline. The photos are converted to a green duotone so they match the palette whatever their original colours. Below the headline a strip plays the real Round Robin scheduler from the simulator (the same engine as the CPU Scheduling page) one time unit at a time. With reduced motion switched on, the hero shows one still photo and the strip stays on its finished state. The photos live in `public/images`, so the site never calls Pexels when it runs.

### Motion

Buttons, links and cards ease between states, pressed buttons dip slightly, sliders grow under the pointer, pages fade in with their blocks rising one after another, and cards on the Home page reveal as they scroll into view. Everything respects the operating-system "reduce motion" setting.

### Navigation and footer

The navigation groups and the footer both read one list, `src/navigation.js`. To add a simulator, add it there, in `App.jsx` and in the Home `SECTIONS`.

## Image credits

The Home page banner uses photographs from [Pexels](https://www.pexels.com) (free licence): Nemuel Sereti, Jakub Pabis, panumas nikhomkhai, Tima Miroshnichenko and Brett Sayles. Each photo is credited on the page. They are stored as WebP files in `public/images`, and no Pexels key is needed to run or deploy the site.

---

## Running Locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
```

`.env.local` (not committed; only needed for the "Explain this step" panel):

```env
GROQ_API_KEY=your_key_here
```

Use exactly `GROQ_API_KEY`. Never name it with a `VITE_` prefix: Vite copies every `VITE_` variable into the public JavaScript bundle. See `.env.example` for the optional settings (`GROQ_MODEL`, `EXPLAIN_RATE_PER_MIN`, `EXPLAIN_GLOBAL_PER_MIN`, `TRUSTED_PROXY_HOPS`).

### Deploying on Vercel

The repository includes `vercel.json` (single-page-app rewrites, security headers, a 30 s limit for the AI function). Set `GROQ_API_KEY` and `TRUSTED_PROXY_HOPS=1` in the project's environment variables. Without a key everything works except the AI panel.
