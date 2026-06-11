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
  3: 'blocks if left fork is held by neighbor',
  4: 'blocks if right fork is held by neighbor',
  5: 'holds BOTH forks — eating',
  6: 'releases forks — neighbors may proceed',
}

export const PHIL_STATES = { THINKING: 'THINKING', HUNGRY: 'HUNGRY', EATING: 'EATING' }

export const PHIL_COLOR = {
  THINKING: 'bg-gray-500/20 border-gray-500/50 text-gray-300',
  HUNGRY:   'bg-amber-500/20 border-amber-500/50 text-amber-300',
  EATING:   'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
}

const N = 5

function canEat(states, forks, i) {
  const left = i
  const right = (i + 1) % N
  return states[i] === 'HUNGRY' && !forks[left] && !forks[right]
}

export function simulateDining(rounds = 8) {
  const steps = []
  let states = new Array(N).fill('THINKING')
  let forks = new Array(N).fill(false) // false = available

  steps.push({
    states: [...states], forks: [...forks],
    actor: null, action: 'init',
    highlightLine: 0,
    explanation: `5 philosophers sit around a circular table. Each philosopher needs BOTH adjacent forks to eat. ${N} forks total.`,
  })

  for (let round = 0; round < rounds; round++) {
    const i = Math.floor(Math.random() * N)
    const name = `P${i}`
    const left = i
    const right = (i + 1) % N

    if (states[i] === 'THINKING') {
      states[i] = 'HUNGRY'
      steps.push({
        states: [...states], forks: [...forks], actor: i, action: 'hungry',
        highlightLine: 2,
        explanation: `${name} stops thinking and gets hungry. Wants to eat but needs fork ${left} (left) and fork ${right} (right).`,
      })
    } else if (states[i] === 'HUNGRY' && canEat(states, forks, i)) {
      forks[left] = true
      steps.push({
        states: [...states], forks: [...forks], actor: i, action: `pick fork ${left}`,
        highlightLine: 3,
        explanation: `${name} picks up fork ${left} (left). Fork is free — acquired successfully.`,
      })
      forks[right] = true
      states[i] = 'EATING'
      steps.push({
        states: [...states], forks: [...forks], actor: i, action: `pick fork ${right} → eating`,
        highlightLine: 4,
        explanation: `${name} picks up fork ${right} (right). Both forks acquired! ${name} starts eating.`,
      })
    } else if (states[i] === 'HUNGRY') {
      const leftBlocked = forks[left]
      const rightBlocked = forks[right]
      steps.push({
        states: [...states], forks: [...forks], actor: i, action: 'blocked',
        highlightLine: leftBlocked ? 3 : 4,
        explanation: `${name} is hungry but fork ${leftBlocked ? left : right} is held by a neighbor. ${name} must wait — potential deadlock if all philosophers are hungry simultaneously!`,
      })
    } else if (states[i] === 'EATING') {
      forks[left] = false
      forks[right] = false
      states[i] = 'THINKING'
      steps.push({
        states: [...states], forks: [...forks], actor: i, action: 'done eating',
        highlightLine: 6,
        explanation: `${name} finishes eating. Puts down fork ${right} and fork ${left}. Returns to thinking. Neighbors P${(i + N - 1) % N} and P${(i + 1) % N} may now proceed.`,
      })
    }
  }

  return steps
}
