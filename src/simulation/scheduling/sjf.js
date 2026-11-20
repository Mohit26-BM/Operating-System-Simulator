import { pickNext, readyList } from './common'

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
  const steps = []
  const done = new Set()
  let time = 0

  while (done.size < processes.length) {
    const next = pickNext(processes, done, time, (p) => p.burst)

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
      explanation: `Selected ${next.id} (burst=${next.burst}) — shortest among ${waitingNow.length + 1} available process(es).`,
    })

    for (let t = 1; t < next.burst; t++) {
      steps.push({
        time: time + t, running: next.id,
        queue: readyList(processes, done, time + t, next.id),
        highlightLine: 6,
        explanation: `Running ${next.id} — ${next.burst - t} burst unit(s) left. SJF won't preempt even if a shorter job arrives now.`,
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
