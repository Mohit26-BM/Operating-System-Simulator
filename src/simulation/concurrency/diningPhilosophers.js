export const DINING_CODE = [
  'repeat forever:',
  '  philosopher thinks',
  '  philosopher gets hungry',
  '  wait(fork[left])   // pick up left fork',
  '  wait(fork[right])  // pick up right fork',
  '  philosopher eats',
  '  signal(fork[right]) // put down right fork',
  '  signal(fork[left])  // put down left fork',
]

export const DINING_ANNOTATIONS = {
  3: 'blocks if the first fork is held by a neighbour',
  4: 'blocks if the second fork is held by a neighbour (while still holding the first!)',
  5: 'holds BOTH forks — eating',
  6: 'releases forks — neighbors may proceed',
}

export const PHIL_STATES = { THINKING: 'THINKING', HUNGRY: 'HUNGRY', EATING: 'EATING' }

export const PHIL_COLOR = {
  THINKING: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
  HUNGRY:   'bg-amber-500/20 border-amber-500/50 text-amber-300',
  EATING:   'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
}

export const N = 5

export const DINING_STRATEGIES = {
  naive:   { label: 'Naive: left fork, then right', description: 'Every philosopher grabs the left fork, then waits for the right one. Simple, but it can deadlock.' },
  ordered: { label: 'Resource ordering', description: 'Always pick up the lower-numbered fork first. This breaks the circular wait, so there is no deadlock.' },
  atomic:  { label: 'Both forks or none', description: 'Take both forks together or neither. No deadlock, but a hungry philosopher can be passed over.' },
}

export function getDiningCode(strategy = 'naive') {
  if (strategy === 'ordered') {
    return [
      'repeat forever:',
      '  philosopher thinks',
      '  philosopher gets hungry',
      '  wait(fork[min(left, right)])   // lower-numbered fork first',
      '  wait(fork[max(left, right)])   // then the higher-numbered one',
      '  philosopher eats',
      '  signal(fork[max(left, right)])',
      '  signal(fork[min(left, right)])',
    ]
  }
  if (strategy === 'atomic') {
    return [
      'repeat forever:',
      '  philosopher thinks',
      '  philosopher gets hungry',
      '  if fork[left] and fork[right] are both free:  // checked together',
      '    take both; otherwise take nothing and wait',
      '  philosopher eats',
      '  put down fork[right]',
      '  put down fork[left]',
    ]
  }
  return DINING_CODE
}

const leftOf = (i) => i
const rightOf = (i) => (i + 1) % N

// The order in which a philosopher reaches for forks under each strategy
function forkOrder(strategy, i) {
  const l = leftOf(i), r = rightOf(i)
  if (strategy === 'ordered') return l < r ? [l, r] : [r, l]
  return [l, r]
}

/**
 * Runs the dining philosophers.
 *   strategy: 'naive' | 'ordered' | 'atomic'
 *   schedule: 'random' (a random philosopher moves each round) or 'worst-case' (everyone is hungry at once and
 *             moves in turn: exactly the timing that deadlocks the naive strategy)
 *   rng:      () => number in [0, 1), injectable so runs can be reproduced
 * Calling simulateDining(16) with a number still works.
 */
export function simulateDining(options = {}) {
  const opts = typeof options === 'number' ? { rounds: options } : options
  const { strategy = 'naive', rounds = 16, schedule = 'random', rng = Math.random } = opts
  if (!DINING_STRATEGIES[strategy]) throw new Error(`Unknown strategy "${strategy}"`)
  if (schedule !== 'random' && schedule !== 'worst-case') throw new Error('Schedule must be "random" or "worst-case"')
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > 200) throw new Error('Rounds must be a whole number from 1 to 200')

  const states = new Array(N).fill(schedule === 'worst-case' ? 'HUNGRY' : 'THINKING')
  const holders = new Array(N).fill(null)       // holders[fork] = the philosopher holding it
  const meals = new Array(N).fill(0)
  const steps = []

  const snapshot = (extra) => ({
    states: [...states], forks: holders.map((h) => h !== null), holders: [...holders], meals: [...meals], ...extra,
  })
  const held = (i) => [leftOf(i), rightOf(i)].filter((f) => holders[f] === i)

  steps.push(snapshot({
    actor: null, action: 'init', highlightLine: 0,
    explanation: `${N} philosophers sit around a circular table with ${N} forks, one between each pair. Each needs BOTH adjacent forks to eat. Strategy: ${DINING_STRATEGIES[strategy].label}.${schedule === 'worst-case' ? ' Worst-case timing: all five are hungry at the same moment.' : ''}`,
  }))

  // Can philosopher i make any progress right now?
  const canAct = (i) => {
    if (states[i] === 'THINKING' || states[i] === 'EATING') return true
    if (strategy === 'atomic') return holders[leftOf(i)] === null && holders[rightOf(i)] === null
    const next = forkOrder(strategy, i).find((f) => holders[f] !== i)
    return next === undefined || holders[next] === null
  }

  for (let round = 0; round < rounds; round++) {
    const i = schedule === 'worst-case' ? round % N : Math.min(N - 1, Math.floor(rng() * N))
    const name = `P${i}`

    if (states[i] === 'THINKING') {
      states[i] = 'HUNGRY'
      steps.push(snapshot({
        actor: i, action: 'hungry', highlightLine: 2,
        explanation: `${name} stops thinking and gets hungry. It wants fork ${leftOf(i)} (left) and fork ${rightOf(i)} (right).`,
      }))
    } else if (states[i] === 'EATING') {
      const a = leftOf(i), b = rightOf(i)
      holders[a] = null
      holders[b] = null
      states[i] = 'THINKING'
      meals[i]++
      steps.push(snapshot({
        actor: i, action: 'done eating', highlightLine: 6,
        explanation: `${name} finishes eating (meal ${meals[i]}) and puts down forks ${b} and ${a}. Neighbours P${(i + N - 1) % N} and P${rightOf(i)} may now proceed.`,
      }))
    } else if (strategy === 'atomic') {
      const l = leftOf(i), r = rightOf(i)
      if (holders[l] === null && holders[r] === null) {
        holders[l] = i
        holders[r] = i
        states[i] = 'EATING'
        steps.push(snapshot({
          actor: i, action: `take forks ${l} and ${r} → eating`, highlightLine: 3,
          explanation: `${name} finds both forks (${l} and ${r}) free and takes them together. It starts eating.`,
        }))
      } else {
        const busy = holders[l] !== null ? l : r
        steps.push(snapshot({
          actor: i, action: 'blocked', highlightLine: 3,
          explanation: `${name} is hungry but fork ${busy} is held by P${holders[busy]}. It takes nothing and waits (it never holds one fork while waiting for the other).`,
        }))
      }
    } else {
      const order = forkOrder(strategy, i)
      const next = order.find((f) => holders[f] !== i)
      const first = held(i).length === 0
      if (holders[next] === null) {
        holders[next] = i
        const both = held(i).length === 2
        if (both) states[i] = 'EATING'
        const side = next === leftOf(i) ? 'left' : 'right'
        steps.push(snapshot({
          actor: i, action: both ? `pick fork ${next} → eating` : `pick fork ${next}`, highlightLine: first ? 3 : 4,
          explanation: both
            ? `${name} picks up fork ${next} (${side}). It now holds both forks and starts eating.`
            : `${name} picks up fork ${next} (${side}) first${strategy === 'ordered' ? ', the lower-numbered of its two forks' : ''}. It now waits for fork ${order.find((f) => f !== next)}.`,
        }))
      } else {
        steps.push(snapshot({
          actor: i, action: 'blocked', highlightLine: first ? 3 : 4,
          explanation: `${name} needs fork ${next} but P${holders[next]} holds it. ${name} blocks${held(i).length ? ` while still holding fork ${held(i)[0]}` : ''}.`,
        }))
      }
    }

    // Deadlock: everybody is hungry and nobody can move
    if (states.every((s) => s === 'HUNGRY') && !Array.from({ length: N }, (_, k) => k).some(canAct)) {
      const holding = Array.from({ length: N }, (_, k) => `P${k} holds fork ${held(k).join(',') || '-'}`)
      steps.push(snapshot({
        actor: null, action: 'DEADLOCK', deadlock: true, highlightLine: 4,
        explanation: `DEADLOCK. Every philosopher is hungry, holds one fork and waits for a neighbour's fork: ${holding.join('; ')}. This is a circular wait, so nobody can ever eat. All four conditions hold: mutual exclusion, hold and wait, no preemption, circular wait.`,
      }))
      break
    }
  }
  return steps
}
