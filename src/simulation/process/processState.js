// Generates a step-by-step process lifecycle simulation
export const PROCESS_STATE_CODE = [
  'process created → NEW',
  'admitted to ready queue → READY',
  'scheduler dispatches → RUNNING',
  'if I/O or event needed:',
  '  process moves → WAITING',
  '  I/O completes → READY again',
  'if preempted by scheduler:',
  '  process moves back → READY',
  'process finishes execution → TERMINATED',
]

export const PROCESS_STATE_ANNOTATIONS = {
  0: 'OS allocates PCB (Process Control Block)',
  1: 'CPU not yet assigned',
  2: 'CPU assigned — instructions executing',
  4: 'CPU freed for other processes',
  5: 'I/O interrupt received',
  8: 'PCB deallocated',
}

export const STATES = ['NEW', 'READY', 'RUNNING', 'WAITING', 'TERMINATED']

export const STATE_COLOR = {
  NEW:        'bg-gray-500/20 border-gray-500/50 text-gray-300',
  READY:      'bg-amber-500/20 border-amber-500/50 text-amber-300',
  RUNNING:    'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
  WAITING:    'bg-rose-500/20 border-rose-500/50 text-rose-300',
  TERMINATED: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
}

export function generateProcessLifecycle(includeIO = true, includePreemption = false) {
  const steps = []

  const push = (state, highlightLine, explanation, transition = null) =>
    steps.push({ state, highlightLine, explanation, transition })

  push('NEW', 0, 'Process is created. OS allocates a Process Control Block (PCB) to track state, registers, and memory.')

  push('READY', 1, 'Process admitted to the ready queue. It waits for the CPU scheduler to dispatch it.', 'NEW → READY (admitted)')

  push('RUNNING', 2, 'Scheduler selects this process. CPU is assigned — instructions are now executing.', 'READY → RUNNING (dispatched)')

  if (includeIO) {
    push('RUNNING', 3, 'Process issues an I/O request (e.g., disk read, network call). It cannot continue until data is ready.')
    push('WAITING', 4, 'CPU is released. Process moves to the waiting queue until I/O completes.', 'RUNNING → WAITING (I/O request)')
    push('WAITING', 5, 'I/O operation completes. Hardware raises an interrupt — OS moves process back to ready queue.')
    push('READY', 5, 'Process is ready again. Waits for scheduler to dispatch it.', 'WAITING → READY (I/O complete)')
    push('RUNNING', 2, 'Scheduler picks the process again. Execution resumes from where it left off.', 'READY → RUNNING (dispatched)')
  }

  if (includePreemption) {
    push('RUNNING', 6, 'Time quantum expired (Round Robin) or higher-priority process arrived. CPU is preempted.')
    push('READY', 7, 'Process is not terminated — moves back to ready queue to wait its turn again.', 'RUNNING → READY (preempted)')
    push('RUNNING', 2, 'Process gets CPU again after waiting in queue.', 'READY → RUNNING (dispatched)')
  }

  push('RUNNING', 8, 'Process executes its final instruction. Calls exit() — signals OS that it is done.')
  push('TERMINATED', 8, 'Process is terminated. OS deallocates the PCB and reclaims all resources.', 'RUNNING → TERMINATED (exit)')

  return steps
}

