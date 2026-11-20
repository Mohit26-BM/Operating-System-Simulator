// Banker's Algorithm (Dijkstra): safety check, step-by-step trace, and the resource-request algorithm.

export const MAX_PROCESSES = 6
export const MAX_RESOURCES = 5
export const MAX_UNITS = 99

const isCount = (n) => Number.isInteger(n) && n >= 0 && n <= MAX_UNITS

export function validateBankersInput({ allocation, max, available, processes, resources }) {
  if (!Number.isInteger(processes) || processes < 1 || processes > MAX_PROCESSES) throw new Error(`Processes must be a whole number from 1 to ${MAX_PROCESSES}`)
  if (!Number.isInteger(resources) || resources < 1 || resources > MAX_RESOURCES) throw new Error(`Resource types must be a whole number from 1 to ${MAX_RESOURCES}`)
  const grid = (m) => Array.isArray(m) && m.length === processes && m.every((row) => Array.isArray(row) && row.length === resources && row.every(isCount))
  if (!grid(allocation)) throw new Error(`Allocation must be a ${processes} x ${resources} grid of whole numbers from 0 to ${MAX_UNITS}`)
  if (!grid(max)) throw new Error(`Maximum must be a ${processes} x ${resources} grid of whole numbers from 0 to ${MAX_UNITS}`)
  if (!Array.isArray(available) || available.length !== resources || !available.every(isCount)) throw new Error(`Available must list ${resources} whole numbers from 0 to ${MAX_UNITS}`)
  for (let i = 0; i < processes; i++) for (let j = 0; j < resources; j++) {
    if (allocation[i][j] > max[i][j]) throw new Error(`P${i} holds more of R${j} (${allocation[i][j]}) than its maximum (${max[i][j]})`)
  }
}

/** Returns { safe, sequence, need, trace, stuck }. `trace` has one entry per process that was able to finish. */
export function runBankers(input) {
  validateBankersInput(input)
  const { allocation, max, available, processes, resources } = input
  const need = allocation.map((row, i) => row.map((a, j) => max[i][j] - a))
  const work = [...available]
  const finish = new Array(processes).fill(false)
  const sequence = []
  const trace = []

  let progressed = true
  while (progressed) {
    progressed = false
    for (let i = 0; i < processes; i++) {
      if (finish[i] || !need[i].every((n, j) => n <= work[j])) continue
      const before = [...work]
      for (let j = 0; j < resources; j++) work[j] += allocation[i][j]
      finish[i] = true
      sequence.push(`P${i}`)
      trace.push({ process: `P${i}`, need: [...need[i]], workBefore: before, workAfter: [...work] })
      progressed = true
    }
  }

  const stuck = finish.flatMap((done, i) => (done ? [] : [{ process: `P${i}`, need: [...need[i]] }]))
  return { safe: stuck.length === 0, sequence, need, trace, stuck, finalWork: work }
}

/**
 * Resource-request algorithm: may process `pid` be granted `request` right now?
 * Returns { granted, reason, result? }. `result` is the safety check of the state after a (pretend) grant.
 */
export function requestResources(input, pid, request) {
  validateBankersInput(input)
  const { allocation, max, available, processes, resources } = input
  if (!Number.isInteger(pid) || pid < 0 || pid >= processes) throw new Error('Choose one of the existing processes')
  if (!Array.isArray(request) || request.length !== resources || !request.every(isCount)) throw new Error(`The request must list ${resources} whole numbers from 0 to ${MAX_UNITS}`)

  const need = allocation[pid].map((a, j) => max[pid][j] - a)
  const over = request.findIndex((r, j) => r > need[j])
  if (over !== -1) return { granted: false, reason: `Error: P${pid} asks for ${request[over]} of R${over} but its remaining need is only ${need[over]}. It has exceeded its declared maximum claim.` }
  const short = request.findIndex((r, j) => r > available[j])
  if (short !== -1) return { granted: false, reason: `P${pid} must wait: it asks for ${request[short]} of R${short} but only ${available[short]} is available.` }

  const next = {
    ...input,
    available: available.map((a, j) => a - request[j]),
    allocation: allocation.map((row, i) => (i === pid ? row.map((a, j) => a + request[j]) : [...row])),
  }
  const result = runBankers(next)
  return result.safe
    ? { granted: true, reason: `Granted. After the pretend allocation the system is still safe (sequence ${result.sequence.join(' → ')}).`, result }
    : { granted: false, reason: `P${pid} must wait: granting this would leave the system in an unsafe state (no process order lets everyone finish).`, result }
}
