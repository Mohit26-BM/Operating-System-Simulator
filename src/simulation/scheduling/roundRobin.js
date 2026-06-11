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
  const remaining = processes.map(p => ({ ...p, rem: p.burst }))
  const steps = []
  let time = 0
  const queue = []
  const enqueued = new Set()

  remaining.filter(p => p.arrival === 0).forEach(p => { queue.push(p.id); enqueued.add(p.id) })

  while (remaining.some(p => p.rem > 0)) {
    if (!queue.length) {
      steps.push({ time, running: null, queue: [], highlightLine: 1, explanation: `Queue empty at t=${time}. Waiting for next arrival.` })
      time++
      remaining.filter(p => !enqueued.has(p.id) && p.arrival <= time).forEach(p => { queue.push(p.id); enqueued.add(p.id) })
      continue
    }

    const id = queue.shift()
    const p = remaining.find(x => x.id === id)
    const slice = Math.min(quantum, p.rem)

    for (let t = 0; t < slice; t++) {
      remaining.filter(x => !enqueued.has(x.id) && x.arrival <= time + 1).forEach(x => { queue.push(x.id); enqueued.add(x.id) })
      steps.push({
        time: time++, running: id, queue: [...queue],
        highlightLine: 3,
        explanation: `Running ${id} — slice unit ${t + 1}/${slice} (quantum=${quantum}, remaining=${p.rem - t}).`,
      })
    }

    p.rem -= slice

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
