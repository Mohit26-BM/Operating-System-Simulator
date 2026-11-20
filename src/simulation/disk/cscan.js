import { sweep } from './sweep'

export const CSCAN_CODE = [
  'sort requests',
  'move head toward higher cylinders',
  '  service all requests in that direction',
  '  when reaching end (max cylinder):',
  '    jump back to cylinder 0 (no service, counted)',
  '  continue servicing from low end upward',
  'circular sweep — uniform wait times',
]

export const CSCAN_ANNOTATIONS = {
  4: 'the return jump services nothing; here it is counted in the total movement',
  6: 'more uniform than SCAN',
}

export function cscan(initialHead, requests, maxCylinder = 199, direction = 'up') {
  return sweep(initialHead, requests, { maxCylinder, direction, toEdge: true, wrap: true })
}
