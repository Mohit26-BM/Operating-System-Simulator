import { sweep } from './sweep'

export const LOOK_CODE = [
  'sort requests',
  'move head in current direction',
  '  service every request in that direction',
  '  when the last request in this direction is done:',
  '    reverse (no trip to the disk edge)',
  '  service remaining requests in the new direction',
  'SCAN without wasted travel to the edge',
]

export const LOOK_ANNOTATIONS = {
  3: 'LOOK turns around at the last request instead of the disk edge — less head movement than SCAN',
  6: 'still starvation-free, and cheaper than SCAN',
}

export const CLOOK_CODE = [
  'sort requests',
  'move head toward higher cylinders',
  '  service every request in that direction',
  '  when the last request is done:',
  '    jump to the lowest waiting request (no service)',
  '  continue servicing upward',
  'C-SCAN without travel to the disk edges',
]

export const CLOOK_ANNOTATIONS = {
  3: 'C-LOOK jumps straight to the lowest waiting request instead of the edge',
  6: 'uniform waiting times with less head movement than C-SCAN',
}

export function look(initialHead, requests, maxCylinder = 199, direction = 'up') {
  return sweep(initialHead, requests, { maxCylinder, direction, toEdge: false, wrap: false })
}

export function clook(initialHead, requests, maxCylinder = 199, direction = 'up') {
  return sweep(initialHead, requests, { maxCylinder, direction, toEdge: false, wrap: true })
}
