import { fcfs, FCFS_DISK_CODE, FCFS_DISK_ANNOTATIONS } from './fcfs'
import { sstf, SSTF_CODE, SSTF_ANNOTATIONS } from './sstf'
import { scan, SCAN_CODE, SCAN_ANNOTATIONS } from './scan'
import { cscan, CSCAN_CODE, CSCAN_ANNOTATIONS } from './cscan'
import { look, clook, LOOK_CODE, LOOK_ANNOTATIONS, CLOOK_CODE, CLOOK_ANNOTATIONS } from './look'

export const DISK_ALGORITHMS = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN', 'LOOK', 'C-LOOK']

export function runDisk({ head, requests, algorithm, maxCylinder = 199, direction = 'up' }) {
  switch (algorithm) {
    case 'FCFS':   return fcfs(head, requests, maxCylinder)
    case 'SSTF':   return sstf(head, requests, maxCylinder)
    case 'SCAN':   return scan(head, requests, maxCylinder, direction)
    case 'C-SCAN': return cscan(head, requests, maxCylinder, direction)
    case 'LOOK':   return look(head, requests, maxCylinder, direction)
    case 'C-LOOK': return clook(head, requests, maxCylinder, direction)
    default:       throw new Error(`Unknown disk algorithm "${algorithm}"`)
  }
}

export function getDiskCode(algorithm) {
  switch (algorithm) {
    case 'SSTF':   return SSTF_CODE
    case 'SCAN':   return SCAN_CODE
    case 'C-SCAN': return CSCAN_CODE
    case 'LOOK':   return LOOK_CODE
    case 'C-LOOK': return CLOOK_CODE
    default:       return FCFS_DISK_CODE
  }
}

export function getDiskAnnotations(algorithm) {
  switch (algorithm) {
    case 'SSTF':   return SSTF_ANNOTATIONS
    case 'SCAN':   return SCAN_ANNOTATIONS
    case 'C-SCAN': return CSCAN_ANNOTATIONS
    case 'LOOK':   return LOOK_ANNOTATIONS
    case 'C-LOOK': return CLOOK_ANNOTATIONS
    default:       return FCFS_DISK_ANNOTATIONS
  }
}
