export const CSCAN_CODE = [
  'sort requests',
  'move head toward higher cylinders',
  '  service all requests in that direction',
  '  when reaching end (max cylinder):',
  '    jump back to cylinder 0 (no service)',
  '  continue servicing from low end upward',
  'circular sweep — uniform wait times',
]

export const CSCAN_ANNOTATIONS = {
  4: 'jump is not counted as service — no stops',
  6: 'more uniform than SCAN',
}

export function cscan(initialHead, requests, maxCylinder = 199) {
  const steps = []
  let head = initialHead
  let total = 0
  const sorted = [...requests].sort((a, b) => a - b)
  const serviced = []

  steps.push({
    head, target: null, movement: 0, total: 0,
    remaining: [...sorted], serviced: [], direction: 'up',
    highlightLine: 0,
    explanation: `Head at ${head}. C-SCAN sweeps in one direction only, then jumps to start.`,
  })

  const upper = sorted.filter(r => r >= head)
  const lower = sorted.filter(r => r < head)

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

  if (lower.length) {
    // Jump to 0
    const jumpDist = head + lower[0]
    total += jumpDist
    steps.push({
      head: lower[0], from: head, target: lower[0], movement: jumpDist, total,
      remaining: [...lower.slice(1)],
      serviced: [...serviced], direction: 'jump',
      highlightLine: 4,
      explanation: `Jump from ${head} → cylinder 0 → ${lower[0]} (no service during jump). Movement counted: ${jumpDist}.`,
    })
    head = lower[0]
    serviced.push(lower[0])

    for (const req of lower.slice(1)) {
      const movement = Math.abs(head - req)
      total += movement
      serviced.push(req)
      steps.push({
        head: req, from: head, target: req, movement, total,
        remaining: [...sorted.filter(r => !serviced.includes(r))],
        serviced: [...serviced], direction: 'up',
        highlightLine: 5,
        explanation: `Continuing upward: ${head} → ${req} (distance=${movement}). Total: ${total}.`,
      })
      head = req
    }
  }

  return steps
}
