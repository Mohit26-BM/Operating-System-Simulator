import { pickNext, readyList } from './common'

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
  const steps = []
  const done = new Set()
  let time = 0

  while (done.size < processes.length) {
    const next = pickNext(processes, done, time, (p) => p.priority)

    if (!next) {
      steps.push({ time, running: null, queue: [], idle: true, duration: 1, highlightLine: 3, explanation: `No process has arrived yet at t=${time}. Advancing time.` })
      time++
      continue
    }

    const start = time
    const waitingNow = readyList(processes, done, time, next.id)

    steps.push({
      time, running: next.id,
      queue: waitingNow,
      highlightLine: 4,
      explanation: `Selected ${next.id} (priority=${next.priority}) — highest priority among ${waitingNow.length + 1} available process(es).`,
    })

    for (let t = 1; t < next.burst; t++) {
      steps.push({
        time: time + t, running: next.id,
        queue: readyList(processes, done, time + t, next.id),
        highlightLine: 6,
        explanation: `Running ${next.id} — ${next.burst - t} burst unit(s) left. Won't preempt even if a higher-priority job arrives.`,
      })
    }

    time += next.burst
    done.add(next.id)
    steps.push({
      time, running: null, queue: readyList(processes, done, time),
      completed: next.id,
      turnaround: time - next.arrival,
      waiting: start - next.arrival,
      highlightLine: 8,
      explanation: `${next.id} finished at t=${time}. Turnaround = ${time - next.arrival}, Waiting = ${start - next.arrival}.`,
    })
  }

  return steps
}
