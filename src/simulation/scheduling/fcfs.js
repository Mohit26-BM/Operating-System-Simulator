import { readyList } from './common'

export const FCFS_CODE = [
  'sort processes by arrival time',
  'for each process in order:',
  '  if CPU idle and process not arrived yet:',
  '    advance time to process arrival',
  '  start = current time',
  '  run process for burst duration',
  '  time += burst',
  '  turnaround = time - arrival',
  '  waiting = start - arrival',
]

export const FCFS_ANNOTATIONS = {
  2: 'CPU sits idle until next process arrives',
  5: 'No preemption — runs to completion',
  7: 'turnaround = finish - arrival',
  8: 'waiting = start - arrival',
}

export function fcfs(processes) {
  const sorted = [...processes].sort((a, b) => a.arrival - b.arrival)
  const steps = []
  const done = new Set()
  let time = 0

  for (const p of sorted) {
    if (time < p.arrival) {
      steps.push({
        time, running: null, queue: [], idle: true, duration: p.arrival - time,
        highlightLine: 2,
        explanation: `CPU is idle. Waiting for ${p.id} to arrive at t=${p.arrival}.`,
      })
      time = p.arrival
    }

    const start = time
    steps.push({
      time, running: p.id, queue: readyList(sorted, done, time, p.id),
      highlightLine: 4,
      explanation: `Starting ${p.id} at t=${start}. It arrived at t=${p.arrival} so waited ${start - p.arrival} unit(s).`,
    })

    for (let t = 1; t < p.burst; t++) {
      steps.push({
        time: time + t, running: p.id,
        queue: readyList(sorted, done, time + t, p.id),
        highlightLine: 5,
        explanation: `Running ${p.id} — ${p.burst - t} burst unit(s) remaining. FCFS never preempts.`,
      })
    }

    time += p.burst
    done.add(p.id)
    steps.push({
      time, running: null, queue: readyList(sorted, done, time),
      completed: p.id,
      turnaround: time - p.arrival,
      waiting: start - p.arrival,
      highlightLine: 7,
      explanation: `${p.id} finished at t=${time}. Turnaround = ${time - p.arrival}, Waiting = ${start - p.arrival}.`,
    })
  }

  return steps
}
