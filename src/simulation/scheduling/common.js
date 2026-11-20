// Shared helpers for the CPU scheduling simulations.

/** Throws a readable error for anything that would make a simulation loop forever or lie. */
export function validateProcesses(processes) {
  if (!Array.isArray(processes)) throw new TypeError('processes must be an array')
  const seen = new Set()
  for (const p of processes) {
    if (typeof p?.id !== 'string' || p.id.trim() === '') throw new Error('Every process needs an id')
    if (seen.has(p.id)) throw new Error(`Duplicate process id "${p.id}"`)
    seen.add(p.id)
    if (!Number.isInteger(p.arrival) || p.arrival < 0) throw new Error(`${p.id}: arrival must be a whole number >= 0`)
    if (!Number.isInteger(p.burst) || p.burst < 1) throw new Error(`${p.id}: burst must be a whole number >= 1`)
    if (p.priority !== undefined && !Number.isFinite(p.priority)) throw new Error(`${p.id}: priority must be a number`)
    if (p.io !== undefined) validateIo(p)
  }
}

export function validateQuantum(quantum) {
  if (!Number.isInteger(quantum) || quantum < 1) throw new RangeError('Time quantum must be a whole number >= 1')
}

/**
 * Processes that have arrived by `time`, are not finished and are not the one running,
 * in arrival order (ties keep the order they were entered in).
 */
export function readyList(processes, done, time, runningId = null) {
  return processes
    .map((p, index) => ({ p, index }))
    .filter(({ p }) => p.arrival <= time && !done.has(p.id) && p.id !== runningId)
    .sort((a, b) => a.p.arrival - b.p.arrival || a.index - b.index)
    .map(({ p }) => p.id)
}

/** Picks the process to run next: lowest `key`, ties go to the earlier arrival, then to input order. */
export function pickNext(processes, done, time, keyOf) {
  let best = null
  processes.forEach((p, index) => {
    if (done.has(p.id) || p.arrival > time) return
    const cand = { p, index, key: keyOf(p) }
    if (!best || cand.key < best.key || (cand.key === best.key && (p.arrival < best.p.arrival || (p.arrival === best.p.arrival && index < best.index)))) best = cand
  })
  return best?.p ?? null
}

export const MAX_IO_PER_PROCESS = 5
export const MAX_IO_DURATION = 50

function validateIo(p) {
  if (!Array.isArray(p.io)) throw new Error(`${p.id}: I/O must be a list`)
  if (p.io.length > MAX_IO_PER_PROCESS) throw new Error(`${p.id}: at most ${MAX_IO_PER_PROCESS} I/O requests`)
  let last = 0
  for (const e of p.io) {
    if (!Number.isInteger(e?.at) || e.at < 1 || e.at >= p.burst) throw new Error(`${p.id}: an I/O request must come after 1 to ${p.burst - 1} CPU units (the burst is ${p.burst})`)
    if (e.at <= last) throw new Error(`${p.id}: I/O requests must be at increasing CPU times`)
    if (!Number.isInteger(e.duration) || e.duration < 1 || e.duration > MAX_IO_DURATION) throw new Error(`${p.id}: I/O duration must be a whole number from 1 to ${MAX_IO_DURATION}`)
    last = e.at
  }
}
