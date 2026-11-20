// A unit-time CPU scheduler that supports what the classic engines leave out:
//   - preemption (SRTF, preemptive priority, Round Robin, multilevel feedback queue),
//   - processes that alternate CPU and I/O (a process leaves the CPU for I/O and later returns to the ready queue),
//   - priority aging and MLFQ priority boost.
//
// Conventions (the same ones the classic engines use):
//   - one step per CPU time unit, plus event steps (I/O start, preemption, completion) that take no CPU time,
//   - arrivals and I/O completions join the ready queue BEFORE a process that was just preempted or timed out,
//   - ties go to the earlier arrival, then to input order,
//   - waiting time counts only time spent READY (not time spent doing I/O).
//
// A process may declare I/O as [{ at, duration }]: after `at` units of CPU it blocks for `duration` units.
// Devices work in parallel, so I/O never queues behind other I/O.

export const POLICIES = ['FCFS', 'SJF', 'SRTF', 'Priority', 'Priority (Preemptive)', 'Round Robin', 'MLFQ']
export const DEFAULT_MLFQ_QUANTA = [2, 4, 8]

export const SRTF_CODE = [
  'every time unit:',
  '  add arrivals and finished-I/O processes to the ready queue',
  '  pick the ready process with the LEAST remaining CPU time',
  '  if it is shorter than the running one: preempt',
  '  run the chosen process for one unit',
  '  if it finished: record turnaround and waiting',
  '  if it starts I/O: leave the CPU, return when I/O ends',
]

export const SRTF_ANNOTATIONS = {
  2: 'preemptive SJF: always the shortest remaining time, which minimizes average waiting time',
  3: 'a strictly shorter job takes the CPU at once (ties keep the running process)',
  6: 'while a process is in I/O the CPU is free for others',
}

export const PRIORITY_PREEMPTIVE_CODE = [
  'every time unit:',
  '  add arrivals and finished-I/O processes to the ready queue',
  '  age waiting processes (priority number decreases)',
  '  pick the ready process with the best priority',
  '  if it beats the running one: preempt',
  '  run the chosen process for one unit',
  '  if it finished or starts I/O: free the CPU',
]

export const PRIORITY_PREEMPTIVE_ANNOTATIONS = {
  2: 'aging stops low-priority processes from starving: each wait interval improves their priority by one',
  4: 'lower number = higher priority; equal priority never preempts',
}

export const MLFQ_CODE = [
  'queues Q0 (top) ... Qn, each with its own quantum',
  'new processes enter Q0',
  'always run the first process of the highest non-empty queue',
  'if a higher queue gets a process: preempt (back of own queue)',
  'if the process uses its whole quantum: demote one level',
  'if it leaves for I/O early: it keeps its level',
  'optionally every S units: move everyone back to Q0 (boost)',
]

export const MLFQ_ANNOTATIONS = {
  1: 'a new process is assumed to be short and interactive, so it starts at the top',
  4: 'CPU-bound processes sink to the lower, longer-quantum queues',
  5: 'I/O-bound processes give up the CPU early, so they stay at high priority',
  6: 'the boost prevents starvation of processes stuck at the bottom',
}

export const GENERIC_IO_CODE = [
  'every time unit:',
  '  add arrivals and finished-I/O processes to the ready queue',
  '  pick the next process by the policy (FCFS order / shortest burst / best priority)',
  '  no preemption, except Round Robin: a used-up quantum sends the process to the back',
  '  run the chosen process for one unit',
  '  if it finished: record turnaround and waiting',
  '  if it starts I/O: leave the CPU, return when I/O ends',
]

export const GENERIC_IO_ANNOTATIONS = {
  2: 'the policy decides only among processes that are ready (not running I/O)',
  6: 'while a process is in I/O the CPU is free for others; it rejoins the BACK of the ready queue',
}

export const ADVANCED_CODE = {
  'SRTF': SRTF_CODE,
  'Priority (Preemptive)': PRIORITY_PREEMPTIVE_CODE,
  'MLFQ': MLFQ_CODE,
}

export const ADVANCED_ANNOTATIONS = {
  'SRTF': SRTF_ANNOTATIONS,
  'Priority (Preemptive)': PRIORITY_PREEMPTIVE_ANNOTATIONS,
  'MLFQ': MLFQ_ANNOTATIONS,
}

const MAX_TICKS = 20000

function ioOf(p) {
  return [...(p.io ?? [])].sort((a, b) => a.at - b.at)
}

export function validateOptions(policy, { quantum, quanta, aging, boost }) {
  if (!POLICIES.includes(policy)) throw new Error(`Unknown scheduling policy "${policy}"`)
  if (policy === 'Round Robin' && (!Number.isInteger(quantum) || quantum < 1)) throw new RangeError('Time quantum must be a whole number >= 1')
  if (policy === 'MLFQ') {
    if (!Array.isArray(quanta) || quanta.length < 2 || quanta.length > 5 || !quanta.every((q) => Number.isInteger(q) && q >= 1 && q <= 50)) throw new RangeError('MLFQ needs 2 to 5 quanta, each a whole number from 1 to 50')
    if (!(boost === 0 || (Number.isInteger(boost) && boost >= 1 && boost <= 1000))) throw new RangeError('Boost interval must be 0 (off) or a whole number from 1 to 1000')
  }
  if (policy === 'Priority (Preemptive)' && !(aging === 0 || (Number.isInteger(aging) && aging >= 1 && aging <= 1000))) throw new RangeError('Aging interval must be 0 (off) or a whole number from 1 to 1000')
}

export function simulateCpu(processes, { policy, quantum = 2, quanta = DEFAULT_MLFQ_QUANTA, aging = 0, boost = 0 } = {}) {
  validateOptions(policy, { quantum, quanta, aging, boost })
  const procs = processes.map((p, index) => ({
    ...p, index, io: ioOf(p), priority: p.priority ?? 1,
    rem: p.burst, cpuDone: 0, ioNext: 0, state: 'NEW', ioEnd: 0,
    waited: 0, agingWait: 0, level: 0, qUsed: 0, finish: null,
  }))
  const byId = new Map(procs.map((p) => [p.id, p]))
  const steps = []
  const ready = []                       // ids in the order they became ready
  let current = null
  let pending = null                     // process that just ran out of quantum: re-queued after this tick's arrivals
  let t = 0

  const effPrio = (p) => (policy === 'Priority (Preemptive)' && aging > 0 ? Math.max(0, p.priority - Math.floor(p.agingWait / aging)) : p.priority)
  const burstLeft = (p) => (p.ioNext < p.io.length ? p.io[p.ioNext].at : p.burst) - p.cpuDone     // CPU units until the next I/O or the end
  const quantumOf = (p) => (policy === 'MLFQ' ? quanta[p.level] : quantum)

  // The number a policy ranks processes by (smaller is better)
  const primary = (p) => {
    if (policy === 'SJF' || policy === 'SRTF') return burstLeft(p)
    if (policy === 'Priority' || policy === 'Priority (Preemptive)') return effPrio(p)
    if (policy === 'MLFQ') return p.level
    return 0
  }
  // "a is better than b": smaller key first; ties follow queue order (FCFS, RR, MLFQ) or arrival, then input order
  const better = (a, b) => {
    const ka = primary(a), kb = primary(b)
    if (ka !== kb) return ka < kb
    if (policy === 'FCFS' || policy === 'Round Robin' || policy === 'MLFQ') return ready.indexOf(a.id) < ready.indexOf(b.id)
    return a.arrival < b.arrival || (a.arrival === b.arrival && a.index < b.index)
  }

  const bestReady = () => {
    let best = null
    for (const id of ready) { const p = byId.get(id); if (!best || better(p, best)) best = p }
    return best
  }
  const names = (ids) => ids.map((id) => (typeof id === 'string' ? id : id.id))

  const snapshot = (extra) => ({
    queue: names(ready.filter((id) => id !== current?.id)),
    blocked: procs.filter((p) => p.state === 'WAITING').map((p) => p.id),
    ...extra,
  })

  while (procs.some((p) => p.state !== 'DONE')) {
    if (t > MAX_TICKS) throw new Error('The simulation did not finish within a sensible time. Check the burst and I/O values.')
    const notes = []

    // 1. arrivals, then finished I/O, then the process that just used up its quantum
    for (const p of procs) if (p.state === 'NEW' && p.arrival <= t) { p.state = 'READY'; ready.push(p.id); notes.push(`${p.id} arrives`) }
    for (const p of procs) if (p.state === 'WAITING' && p.ioEnd <= t) { p.state = 'READY'; ready.push(p.id); notes.push(`${p.id} finishes I/O`) }
    if (pending) { pending.state = 'READY'; ready.push(pending.id); pending = null }

    // 2. MLFQ priority boost
    if (policy === 'MLFQ' && boost > 0 && t > 0 && t % boost === 0 && procs.some((p) => p.state !== 'DONE' && p.level > 0)) {
      for (const p of procs) if (p.state !== 'DONE') p.level = 0
      notes.push(`priority boost: everyone returns to Q0`)
    }

    // 3. choose who runs this unit
    const preemptive = policy === 'SRTF' || policy === 'Priority (Preemptive)' || policy === 'MLFQ'
    const candidate = bestReady()
    // a strictly better candidate preempts; an equal one never does
    if (current && preemptive && candidate && primary(candidate) < primary(current)) {
      steps.push(snapshot({
        time: t, running: null, event: 'preempt', highlightLine: policy === 'MLFQ' ? 3 : policy === 'SRTF' ? 3 : 4,
        explanation: `t=${t}: ${candidate.id} preempts ${current.id}. ${policy === 'SRTF' ? `${candidate.id} needs ${burstLeft(candidate)} more unit(s) against ${current.id}'s ${burstLeft(current)}.` : policy === 'MLFQ' ? `${candidate.id} is in a higher queue (Q${candidate.level} above Q${current.level}).` : `${candidate.id} has priority ${effPrio(candidate)}, better than ${current.id}'s ${effPrio(current)}.`} ${current.id} goes back to the ready queue.`,
      }))
      current.state = 'READY'
      current.qUsed = 0
      current.agingWait = 0
      ready.push(current.id)
      current = null
    }
    if (!current) {
      const next = bestReady()
      if (next) {
        ready.splice(ready.indexOf(next.id), 1)
        current = next
        current.state = 'RUNNING'
        current.qUsed = 0
      }
    }

    // 4. run one unit (or idle)
    if (!current) {
      const blocked = procs.filter((p) => p.state === 'WAITING').map((p) => p.id)
      steps.push({
        time: t, running: null, queue: [], blocked, idle: true, duration: 1, highlightLine: 0,
        explanation: `t=${t}: the CPU is idle. ${blocked.length ? `Every unfinished process that has arrived is waiting for I/O (${blocked.join(', ')}).` : 'No process has arrived yet.'}${notes.length ? ' ' + notes.join('; ') + '.' : ''}`,
      })
      t++
      continue
    }

    const p = current
    for (const id of ready) { const q = byId.get(id); q.waited++; q.agingWait++ }
    // a process keeps the priority it earned by waiting for as long as it holds the CPU; it is reset when it leaves
    p.cpuDone++
    p.rem--
    p.qUsed++
    steps.push(snapshot({
      time: t, running: p.id, level: policy === 'MLFQ' ? p.level : undefined,
      levels: policy === 'MLFQ' ? Object.fromEntries(procs.map((x) => [x.id, x.level])) : undefined,
      highlightLine: policy === 'MLFQ' ? 2 : policy === 'SRTF' ? 4 : policy === 'Priority (Preemptive)' ? 5 : 4,
      explanation: `t=${t}: ${p.id} runs (CPU used ${p.cpuDone}/${p.burst}${policy === 'MLFQ' ? `, queue Q${p.level}, quantum ${p.qUsed}/${quantumOf(p)}` : policy === 'Round Robin' ? `, quantum ${p.qUsed}/${quantum}` : ''}${policy.startsWith('Priority') ? `, priority ${effPrio(p)}` : ''}).${notes.length ? ' ' + notes.join('; ') + '.' : ''}`,
    }))
    t++

    // 5. what happens at the end of this unit?
    if (p.rem === 0) {
      p.state = 'DONE'
      p.finish = t
      steps.push(snapshot({
        time: t, running: null, completed: p.id, turnaround: t - p.arrival, waiting: p.waited, highlightLine: 5,
        explanation: `${p.id} finished at t=${t}. Turnaround = ${t - p.arrival}, waiting (time in the ready queue) = ${p.waited}${p.io.length ? `, I/O time = ${p.io.reduce((a, x) => a + x.duration, 0)}` : ''}.`,
      }))
      current = null
    } else if (p.ioNext < p.io.length && p.cpuDone === p.io[p.ioNext].at) {
      const dur = p.io[p.ioNext].duration
      p.ioNext++
      p.state = 'WAITING'
      p.ioEnd = t + dur
      p.qUsed = 0
      p.agingWait = 0
      steps.push(snapshot({
        time: t, running: null, event: 'io-start', highlightLine: policy === 'MLFQ' ? 5 : 6,
        explanation: `t=${t}: ${p.id} issues an I/O request and leaves the CPU for ${dur} unit(s) (back in the ready queue at t=${t + dur}).${policy === 'MLFQ' ? ` It gave up the CPU before using its quantum, so it stays in Q${p.level}.` : ''}`,
      }))
      current = null
    } else if ((policy === 'Round Robin' || policy === 'MLFQ') && p.qUsed >= quantumOf(p)) {
      const from = p.level
      if (policy === 'MLFQ' && p.level < quanta.length - 1) p.level++
      pending = p
      pending.state = 'READY'
      p.qUsed = 0
      p.agingWait = 0
      steps.push(snapshot({
        queue: [...names(ready), p.id],
        time: t, running: null, event: 'quantum', highlightLine: policy === 'MLFQ' ? 4 : 3,
        explanation: policy === 'MLFQ'
          ? `t=${t}: ${p.id} used its whole quantum in Q${from}${p.level !== from ? ` and is demoted to Q${p.level}` : ' (already the lowest queue)'}. It goes to the back of Q${p.level}.`
          : `t=${t}: ${p.id} used its full quantum (${quantum}) with ${p.rem} unit(s) left and goes to the back of the queue.`,
      }))
      current = null
    }
  }
  return steps
}

