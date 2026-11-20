// One engine for the four "elevator" disk algorithms.
//
//            goes to the disk edge     stops at the last request
//   sweeps back and forth       SCAN                    LOOK
//   one way, then wraps         C-SCAN                  C-LOOK
//
// Head movement is counted in cylinders, including the trip to the edge and the wrap-around jump
// (some textbooks leave the return jump out of the total; the explanation text says which is used).

export function validateDiskInput(head, requests, maxCylinder) {
  if (!Number.isInteger(maxCylinder) || maxCylinder < 1) throw new Error('The disk size must be a whole number >= 1')
  if (!Number.isInteger(head) || head < 0 || head > maxCylinder) throw new Error(`Head position must be a whole number from 0 to ${maxCylinder}`)
  if (!Array.isArray(requests) || requests.length === 0) throw new Error('Enter at least one request')
  if (requests.length > 100) throw new Error('At most 100 requests are supported')
  if (!requests.every((r) => Number.isInteger(r) && r >= 0 && r <= maxCylinder)) throw new Error(`Every request must be a whole number from 0 to ${maxCylinder}`)
}

export function sweep(initialHead, requests, { maxCylinder = 199, direction = 'up', toEdge, wrap }) {
  validateDiskInput(initialHead, requests, maxCylinder)
  if (direction !== 'up' && direction !== 'down') throw new Error('Direction must be "up" or "down"')

  const up = direction === 'up'
  const sign = up ? 1 : -1
  const name = wrap ? (toEdge ? 'C-SCAN' : 'C-LOOK') : toEdge ? 'SCAN' : 'LOOK'
  const edge = up ? maxCylinder : 0
  const farEdge = up ? 0 : maxCylinder

  // requests the head meets going its way, nearest first; the others wait behind it
  const ahead = requests.filter((r) => (up ? r >= initialHead : r <= initialHead)).sort((a, b) => sign * (a - b))
  const behind = requests.filter((r) => (up ? r < initialHead : r > initialHead))

  const steps = []
  const remaining = [...requests]
  const serviced = []
  let head = initialHead
  let total = 0

  const snapshot = (extra) => ({ remaining: [...remaining], serviced: [...serviced], total, ...extra })

  steps.push(snapshot({
    head, target: null, movement: 0, direction,
    highlightLine: 0,
    explanation: `Head at cylinder ${head}, moving ${up ? 'toward higher' : 'toward lower'} cylinders. ${name} ${wrap ? 'sweeps one way, then wraps around' : 'sweeps to one end, then reverses'}${toEdge ? ' and always travels to the disk edge' : ' but turns around at the last request'}.`,
  }))

  const service = (req, dir, line, label) => {
    const movement = Math.abs(head - req)
    total += movement
    serviced.push(req)
    remaining.splice(remaining.indexOf(req), 1)
    steps.push(snapshot({
      head: req, from: head, target: req, movement, direction: dir,
      highlightLine: line,
      explanation: `${label}: ${head} → ${req} (distance ${movement}). Total: ${total}.`,
    }))
    head = req
  }

  const travel = (to, dir, line, text) => {
    const movement = Math.abs(head - to)
    total += movement
    steps.push(snapshot({ head: to, from: head, target: null, movement, direction: dir, highlightLine: line, explanation: `${text} Moved ${movement}. Total: ${total}.` }))
    head = to
  }

  for (const r of ahead) service(r, direction, 2, `Moving ${up ? 'up' : 'down'}`)

  if (toEdge && head !== edge) {
    travel(edge, direction, wrap ? 3 : 3, behind.length
      ? `No more requests ahead, but ${name} does not know that: it carries on to the ${up ? 'last' : 'first'} cylinder (${edge}).`
      : `${name} carries on to the ${up ? 'last' : 'first'} cylinder (${edge}) even though nothing is left to service.`)
  }

  if (behind.length === 0) return steps

  if (wrap) {
    const first = (up ? behind.sort((a, b) => a - b) : behind.sort((a, b) => b - a))[0]
    const from = toEdge ? farEdge : first
    const jumpFrom = head
    const jump = Math.abs(jumpFrom - from)
    total += jump
    head = from
    steps.push(snapshot({
      head, from: jumpFrom, target: null, movement: jump, direction: 'jump',
      highlightLine: wrap && toEdge ? 4 : 3,
      explanation: toEdge
        ? `Return jump from ${jumpFrom} to cylinder ${farEdge} without servicing anything (counted in the total: ${jump}). Total: ${total}.`
        : `${name} jumps from ${jumpFrom} straight to the nearest waiting request at ${first} without servicing anything (counted: ${jump}). Total: ${total}.`,
    }))
    const order = [...behind].sort((a, b) => sign * (a - b))
    for (const r of order) service(r, direction, 5, `Continuing ${up ? 'up' : 'down'}`)
    return steps
  }

  // back-and-forth: reverse and service what was left behind, nearest first
  const back = [...behind].sort((a, b) => -sign * (a - b))
  for (const r of back) service(r, up ? 'down' : 'up', 5, `Reversed, moving ${up ? 'down' : 'up'}`)
  return steps
}
