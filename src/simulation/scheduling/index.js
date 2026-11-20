import { fcfs, FCFS_CODE, FCFS_ANNOTATIONS } from './fcfs'
import { sjf, SJF_CODE, SJF_ANNOTATIONS } from './sjf'
import { roundRobin, RR_CODE, RR_ANNOTATIONS } from './roundRobin'
import { priority, PRIORITY_CODE, PRIORITY_ANNOTATIONS } from './priority'
import { validateProcesses } from './common'
import { simulateCpu, DEFAULT_MLFQ_QUANTA, ADVANCED_CODE, ADVANCED_ANNOTATIONS, GENERIC_IO_CODE, GENERIC_IO_ANNOTATIONS } from './advanced'

export const SCHEDULING_ALGORITHMS = ['FCFS', 'SJF', 'SRTF', 'Round Robin', 'Priority', 'Priority (Preemptive)', 'MLFQ']
const CLASSIC = { FCFS: fcfs, SJF: sjf, Priority: priority }

/**
 * options: { quanta: [2,4,8] (MLFQ), aging: 0 (preemptive priority, 0 = off), boost: 0 (MLFQ, 0 = off) }
 * The four classic algorithms keep their original engines when no process does I/O;
 * everything else (and anything with I/O) runs on the unit-time engine in advanced.js.
 */
export function runScheduling(processes, algorithm, quantum = 2, options = {}) {
  if (!SCHEDULING_ALGORITHMS.includes(algorithm)) throw new Error(`Unknown scheduling algorithm "${algorithm}"`)
  if (!processes.length) return []
  validateProcesses(processes)
  const hasIo = processes.some((p) => p.io?.length)
  if (!hasIo) {
    if (algorithm === 'Round Robin') return roundRobin(processes, quantum)
    if (CLASSIC[algorithm]) return CLASSIC[algorithm](processes)
  }
  return simulateCpu(processes, { policy: algorithm, quantum, quanta: options.quanta ?? DEFAULT_MLFQ_QUANTA, aging: options.aging ?? 0, boost: options.boost ?? 0 })
}

const isAdvanced = (algorithm) => algorithm in ADVANCED_CODE

export function getCode(algorithm, withIo = false) {
  if (isAdvanced(algorithm)) return ADVANCED_CODE[algorithm]
  if (withIo) return GENERIC_IO_CODE
  switch (algorithm) {
    case 'SJF':         return SJF_CODE
    case 'Round Robin': return RR_CODE
    case 'Priority':    return PRIORITY_CODE
    default:            return FCFS_CODE
  }
}

export function getAnnotations(algorithm, withIo = false) {
  if (isAdvanced(algorithm)) return ADVANCED_ANNOTATIONS[algorithm]
  if (withIo) return GENERIC_IO_ANNOTATIONS
  switch (algorithm) {
    case 'SJF':         return SJF_ANNOTATIONS
    case 'Round Robin': return RR_ANNOTATIONS
    case 'Priority':    return PRIORITY_ANNOTATIONS
    default:            return FCFS_ANNOTATIONS
  }
}
