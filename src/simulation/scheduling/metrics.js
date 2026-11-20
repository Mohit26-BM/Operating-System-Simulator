// Pure calculations behind the metrics panel and the Gantt chart (kept out of the components so they can be tested).

/** Summary numbers for a finished schedule. All times are in the simulation's time units. */
export function computeMetrics(steps, processes) {
  if (!steps.length || !processes.length) return null
  const completions = steps.filter((s) => s.completed)
  if (!completions.length) return null

  const totalTime = Math.max(...completions.map((s) => s.time))           // when the last process finished
  const busyTime = steps.filter((s) => s.running !== null && s.running !== undefined).length // one running step = one time unit
  const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length

  // Response time = first time a process gets the CPU minus its arrival
  const responses = processes.flatMap((p) => {
    const first = steps.find((s) => s.running === p.id)
    return first ? [first.time - p.arrival] : []
  })

  return {
    avgWaiting: avg(completions.map((s) => s.waiting ?? 0)),
    avgTurnaround: avg(completions.map((s) => s.turnaround ?? 0)),
    avgResponse: responses.length ? avg(responses) : 0,
    cpuUtil: totalTime > 0 ? (100 * busyTime) / totalTime : 0,
    throughput: totalTime > 0 ? completions.length / totalTime : 0,
    totalTime,
    busyTime,
    completions: completions.length,
  }
}

const MAX_IDLE_CELLS = 8

/** One cell per CPU time unit up to `upTo` (inclusive step index). Long idle gaps collapse into one wide cell. */
export function buildGantt(steps, upTo) {
  const cells = []
  for (let i = 0; i <= upTo && i < steps.length; i++) {
    const s = steps[i]
    if (s.running) cells.push({ pid: s.running, time: s.time, span: 1, stepIndex: i })
    else if (s.idle) {
      const n = Math.max(1, s.duration ?? 1)
      if (n <= MAX_IDLE_CELLS) for (let k = 0; k < n; k++) cells.push({ pid: null, time: s.time + k, span: 1, stepIndex: i })
      else cells.push({ pid: null, time: s.time, span: n, stepIndex: i })
    }
  }
  return cells
}
