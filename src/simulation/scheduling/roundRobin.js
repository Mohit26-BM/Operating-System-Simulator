import { validateQuantum } from './common'

export const RR_CODE = [
  'enqueue processes arriving at t=0',
  'while queue not empty:',
  '  process = dequeue front',
  '  run for min(quantum, remaining) units',
  '  enqueue any newly arrived processes',
  '  if remaining > 0: re-enqueue process',
  '  else: record finish time',
  '  turnaround = finish - arrival',
  '  waiting = turnaround - burst',
]

export const RR_ANNOTATIONS = {
  3: 'time-slice — never runs more than quantum',
  5: 'new arrivals join queue during slice',
  6: 'not done — goes back to end of queue',
  8: 'waiting = turnaround − burst',
}

export function roundRobin(processes, quantum) {
  validateQuantum(quantum)
  const order = processes.map((p, index) => ({ ...p, index, rem: p.burst })).sort((a, b) => a.arrival - b.arrival || a.index - b.index)
  const steps = []
  const queue = []
  let time = 0
  let next = 0   // next not-yet-admitted process in arrival order

  // Processes that have arrived by `until` join the back of the queue (arrivals first, then the preempted process).
  const admit = (until) => { while (next < order.length && order[next].arrival <= until) queue.push(order[next++].id) }
  admit(0)

  while (queue.length || next < order.length) {
    if (!queue.length) {
      steps.push({ time, running: null, queue: [], idle: true, duration: order[next].arrival - time, highlightLine: 1, explanation: `Queue empty at t=${time}. Waiting for the next arrival (${order[next].id} at t=${order[next].arrival}).` })
      time = order[next].arrival
      admit(time)
      continue
    }

    const id = queue.shift()
    const p = order.find((x) => x.id === id)
    const slice = Math.min(quantum, p.rem)
    const before = p.rem

    for (let t = 0; t < slice; t++) {
      admit(time + 1)
      steps.push({
        time: time++, running: id, queue: [...queue],
        highlightLine: 3,
        explanation: `Running ${id} — slice unit ${t + 1}/${slice} (quantum=${quantum}, remaining=${before - t}).`,
      })
    }

    p.rem -= slice
    admit(time)

    if (p.rem > 0) {
      queue.push(id)
      steps.push({
        time, running: null, queue: [...queue],
        highlightLine: 5,
        explanation: `${id} used its full quantum (${quantum} units) but still has ${p.rem} unit(s) left. Moved to back of queue.`,
      })
    } else {
      const turnaround = time - p.arrival
      steps.push({
        time, running: null, queue: [...queue],
        completed: id,
        turnaround,
        waiting: turnaround - p.burst,
        highlightLine: 7,
        explanation: `${id} finished at t=${time}. Turnaround = ${turnaround}, Waiting = ${turnaround - p.burst}.`,
      })
    }
  }

  return steps
}
