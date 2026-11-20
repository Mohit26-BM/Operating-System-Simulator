import { sweep } from './sweep'

export const SCAN_CODE = [
  'sort requests',
  'move head in current direction',
  '  service all requests in that direction',
  '  when reaching the end of the disk:',
  '    reverse direction',
  '  service requests in new direction',
  'like an elevator — sweeps back and forth',
]

export const SCAN_ANNOTATIONS = {
  1: 'direction: increasing first (toward high cylinders)',
  3: 'SCAN always runs to the edge of the disk before reversing (LOOK turns at the last request)',
  6: 'fairer than SSTF — no starvation',
}

export function scan(initialHead, requests, maxCylinder = 199, direction = 'up') {
  return sweep(initialHead, requests, { maxCylinder, direction, toEdge: true, wrap: false })
}
