import { validateDiskInput } from './sweep'

export const FCFS_DISK_CODE = [
  'service requests in arrival order',
  'for each request in queue:',
  '  movement = |head - request|',
  '  move head to request',
  '  totalMovement += movement',
  'no reordering — simple but inefficient',
]

export const FCFS_DISK_ANNOTATIONS = {
  0: 'no optimization — first come first served',
  2: 'seek distance for this request',
  5: 'may cause excessive head movement',
}

export function fcfs(initialHead, requests, maxCylinder = 199) {
  validateDiskInput(initialHead, requests, maxCylinder)
  const steps = []
  let head = initialHead
  let total = 0
  const remaining = [...requests]

  steps.push({
    head, target: null, movement: 0, total: 0,
    remaining: [...remaining], serviced: [],
    highlightLine: 0,
    explanation: `Head starts at cylinder ${head}. ${requests.length} requests to service in arrival order.`,
  })

  const serviced = []
  for (const req of requests) {
    const movement = Math.abs(head - req)
    total += movement
    serviced.push(req)
    remaining.shift()
    steps.push({
      head: req, target: req, movement, total,
      from: head,
      remaining: [...remaining],
      serviced: [...serviced],
      highlightLine: 2,
      explanation: `Head moves from ${head} → ${req}. Seek distance: ${movement}. Total so far: ${total}.`,
    })
    head = req
  }

  return steps
}
