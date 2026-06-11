import { fcfs, FCFS_CODE, FCFS_ANNOTATIONS } from './fcfs'
import { sjf, SJF_CODE, SJF_ANNOTATIONS } from './sjf'
import { roundRobin, RR_CODE, RR_ANNOTATIONS } from './roundRobin'
import { priority, PRIORITY_CODE, PRIORITY_ANNOTATIONS } from './priority'

export function runScheduling(processes, algorithm, quantum = 2) {
  if (!processes.length) return []
  switch (algorithm) {
    case 'FCFS':        return fcfs(processes)
    case 'SJF':         return sjf(processes)
    case 'Round Robin': return roundRobin(processes, quantum)
    case 'Priority':    return priority(processes)
    default:            return fcfs(processes)
  }
}

export function getCode(algorithm) {
  switch (algorithm) {
    case 'FCFS':        return FCFS_CODE
    case 'SJF':         return SJF_CODE
    case 'Round Robin': return RR_CODE
    case 'Priority':    return PRIORITY_CODE
    default:            return FCFS_CODE
  }
}

export function getAnnotations(algorithm) {
  switch (algorithm) {
    case 'FCFS':        return FCFS_ANNOTATIONS
    case 'SJF':         return SJF_ANNOTATIONS
    case 'Round Robin': return RR_ANNOTATIONS
    case 'Priority':    return PRIORITY_ANNOTATIONS
    default:            return FCFS_ANNOTATIONS
  }
}
