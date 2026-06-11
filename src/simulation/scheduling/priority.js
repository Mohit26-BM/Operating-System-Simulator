export const PRIORITY_CODE = [
  'sort processes by arrival time',
  'while unfinished processes exist:',
  '  available = processes arrived by now',
  '  if none available: advance time',
  '  next = process with lowest priority number',
  '  start = current time',
  '  run next to completion (non-preemptive)',
  '  time += next.burst',
  '  turnaround = time - arrival',
  '  waiting = start - arrival',
]

export const PRIORITY_ANNOTATIONS = {
  4: 'lower number = higher priority',
  6: 'non-preemptive — runs to completion',
  8: 'turnaround = finish − arrival',
  9: 'waiting = start − arrival',
}

export function priority(processes) {
  const remaining = processes.map(p => ({ ...p }))
  const steps = []
  let time = 0
  const done = new Set()

  while (done.size < processes.length) {
    const available = remaining.filter(p => !done.has(p.id) && p.arrival <= time)

    if (!available.length) {
      steps.push({ time, running: null, queue: [], highlightLine: 3, explanation: `No process available at t=${time}. Advancing time.` })
      time++
      continue
    }

    const next = available.reduce((a, b) => a.priority < b.priority ? a : b)
    const start = time

    steps.push({
      time, running: next.id,
      queue: available.filter(p => p.id !== next.id).map(p => p.id),
      highlightLine: 4,
      explanation: `Selected ${next.id} (priority=${next.priority}) — highest priority among ${available.length} available process(es).`,
    })

    for (let t = 1; t < next.burst; t++) {
      const queue = remaining.filter(p => !done.has(p.id) && p.arrival <= time + t && p.id !== next.id).map(p => p.id)
      steps.push({
        time: time + t, running: next.id, queue,
        highlightLine: 6,
        explanation: `Running ${next.id} — ${next.burst - t} burst unit(s) left. Won't preempt even if higher-priority job arrives.`,
      })
    }

    time += next.burst
    done.add(next.id)
    steps.push({
      time, running: null, queue: [],
      completed: next.id,
      turnaround: time - next.arrival,
      waiting: start - next.arrival,
      highlightLine: 8,
      explanation: `${next.id} finished at t=${time}. Turnaround = ${time - next.arrival}, Waiting = ${start - next.arrival}.`,
    })
  }

  return steps
}
