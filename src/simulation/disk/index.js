import { fcfs, FCFS_DISK_CODE, FCFS_DISK_ANNOTATIONS } from './fcfs'
import { sstf, SSTF_CODE, SSTF_ANNOTATIONS } from './sstf'
import { scan, SCAN_CODE, SCAN_ANNOTATIONS } from './scan'
import { cscan, CSCAN_CODE, CSCAN_ANNOTATIONS } from './cscan'

export function runDisk({ head, requests, algorithm, maxCylinder = 199 }) {
  if (!requests.length) return []
  switch (algorithm) {
    case 'FCFS':   return fcfs(head, requests)
    case 'SSTF':   return sstf(head, requests)
    case 'SCAN':   return scan(head, requests, maxCylinder)
    case 'C-SCAN': return cscan(head, requests, maxCylinder)
    default:       return fcfs(head, requests)
  }
}

export function getDiskCode(algorithm) {
  switch (algorithm) {
    case 'FCFS':   return FCFS_DISK_CODE
    case 'SSTF':   return SSTF_CODE
    case 'SCAN':   return SCAN_CODE
    case 'C-SCAN': return CSCAN_CODE
    default:       return FCFS_DISK_CODE
  }
}

export function getDiskAnnotations(algorithm) {
  switch (algorithm) {
    case 'FCFS':   return FCFS_DISK_ANNOTATIONS
    case 'SSTF':   return SSTF_ANNOTATIONS
    case 'SCAN':   return SCAN_ANNOTATIONS
    case 'C-SCAN': return CSCAN_ANNOTATIONS
    default:       return FCFS_DISK_ANNOTATIONS
  }
}
