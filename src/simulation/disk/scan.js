export const SCAN_CODE = [
  'sort requests',
  'move head in current direction',
  '  service all requests in that direction',
  '  when reaching end or no more in direction:',
  '    reverse direction',
  '  service requests in new direction',
  'like an elevator — sweeps back and forth',
]

export const SCAN_ANNOTATIONS = {
  1: 'direction: increasing first (toward high cylinders)',
  3: 'reverses at boundary or last request',
  6: 'fairer than SSTF — no starvation',
}

export function scan(initialHead, requests, maxCylinder = 199) {
  const steps = []
  let head = initialHead
  let total = 0
  const sorted = [...requests].sort((a, b) => a - b)
  const serviced = []

  steps.push({
    head, target: null, movement: 0, total: 0,
    remaining: [...sorted], serviced: [],
    direction: 'up',
    highlightLine: 0,
    explanation: `Head at ${head}. SCAN sweeps toward higher cylinders first, then reverses.`,
  })

  // Go up first
  const upper = sorted.filter(r => r >= head)
  const lower = sorted.filter(r => r < head).reverse()

  for (const req of upper) {
    const movement = Math.abs(head - req)
    total += movement
    serviced.push(req)
    steps.push({
      head: req, from: head, target: req, movement, total,
      remaining: [...sorted.filter(r => !serviced.includes(r))],
      serviced: [...serviced], direction: 'up',
      highlightLine: 2,
      explanation: `Moving up: ${head} → ${req} (distance=${movement}). Total: ${total}.`,
    })
    head = req
  }

  for (const req of lower) {
    const movement = Math.abs(head - req)
    total += movement
    serviced.push(req)
    steps.push({
      head: req, from: head, target: req, movement, total,
      remaining: [...sorted.filter(r => !serviced.includes(r))],
      serviced: [...serviced], direction: 'down',
      highlightLine: 2,
      explanation: `Moving down (reversed): ${head} → ${req} (distance=${movement}). Total: ${total}.`,
    })
    head = req
  }

  return steps
}
