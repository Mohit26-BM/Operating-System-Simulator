export const SJF_CODE = [
  'sort processes by arrival time',
  'while unfinished processes exist:',
  '  available = processes arrived by now',
  '  if none available: advance time',
  '  next = process with shortest burst',
  '  start = current time',
  '  run next to completion (non-preemptive)',
  '  time += next.burst',
  '  turnaround = time - arrival',
  '  waiting = start - arrival',
]

export const SJF_ANNOTATIONS = {
  4: 'shortest burst among arrived processes',
  6: 'SJF is non-preemptive — no interruption',
  8: 'turnaround = finish − arrival',
  9: 'waiting = start − arrival',
}

export function sjf(processes) {
  const remaining = processes.map(p => ({ ...p }))
  const steps = []
  let time = 0
  const done = new Set()

  while (done.size < processes.length) {
    const available = remaining.filter(p => !done.has(p.id) && p.arrival <= time)

    if (!available.length) {
      steps.push({ time, running: null, queue: [], highlightLine: 3, explanation: `No process has arrived yet at t=${time}. Advancing time.` })
      time++
      continue
    }

    const next = available.reduce((a, b) => a.burst < b.burst ? a : b)
    const start = time

    steps.push({
      time, running: next.id,
      queue: available.filter(p => p.id !== next.id).map(p => p.id),
      highlightLine: 4,
      explanation: `Selected ${next.id} (burst=${next.burst}) — shortest among ${available.length} available process(es).`,
    })

    for (let t = 1; t < next.burst; t++) {
      const queue = remaining.filter(p => !done.has(p.id) && p.arrival <= time + t && p.id !== next.id).map(p => p.id)
      steps.push({
        time: time + t, running: next.id, queue,
        highlightLine: 6,
        explanation: `Running ${next.id} — ${next.burst - t} burst unit(s) left. SJF won't preempt even if a shorter job arrives now.`,
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
