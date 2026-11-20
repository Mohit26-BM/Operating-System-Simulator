import { validateDiskInput } from './sweep'

export const SSTF_CODE = [
  'while requests remain:',
  '  find request nearest to current head',
  '  movement = |head - nearest|',
  '  move head to nearest request',
  '  remove request from queue',
  '  totalMovement += movement',
]

export const SSTF_ANNOTATIONS = {
  1: 'greedy — always picks closest',
  3: 'can cause starvation of far requests',
}

export function sstf(initialHead, requests, maxCylinder = 199) {
  validateDiskInput(initialHead, requests, maxCylinder)
  const steps = []
  let head = initialHead
  let total = 0
  const remaining = [...requests]

  steps.push({
    head, target: null, movement: 0, total: 0,
    remaining: [...remaining], serviced: [],
    highlightLine: 0,
    explanation: `Head starts at cylinder ${head}. SSTF will always pick the nearest unserviced request.`,
  })

  const serviced = []
  while (remaining.length) {
    const nearest = remaining.reduce((a, b) =>
      Math.abs(a - head) <= Math.abs(b - head) ? a : b
    )
    const movement = Math.abs(head - nearest)
    total += movement
    remaining.splice(remaining.indexOf(nearest), 1)
    serviced.push(nearest)
    steps.push({
      head: nearest, target: nearest, from: head, movement, total,
      remaining: [...remaining],
      serviced: [...serviced],
      highlightLine: 1,
      explanation: `Nearest to ${head} is ${nearest} (distance=${movement}). Total movement: ${total}.`,
    })
    head = nearest
  }

  return steps
}
