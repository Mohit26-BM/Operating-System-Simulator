export const PC_CODE = [
  '// Semaphores: empty=N, full=0, mutex=1',
  'Producer:',
  '  wait(empty)   // block if buffer full',
  '  wait(mutex)   // acquire lock',
  '  buffer.add(item)',
  '  signal(mutex) // release lock',
  '  signal(full)  // notify consumer',
  'Consumer:',
  '  wait(full)    // block if buffer empty',
  '  wait(mutex)   // acquire lock',
  '  item = buffer.remove()',
  '  signal(mutex) // release lock',
  '  signal(empty) // notify producer',
]

export const PC_ANNOTATIONS = {
  2: 'decrements empty; blocks if empty=0',
  3: 'mutual exclusion — only one at a time',
  6: 'wakes a blocked consumer',
  8: 'decrements full; blocks if full=0',
  12: 'wakes a blocked producer',
}

export const MAX_BUFFER = 8
export const MAX_OPERATIONS = 30

/**
 * Bounded buffer with counting semaphores. Each attempt, either the producer or the consumer runs.
 * If its semaphore is 0 it blocks (the step says so) instead of silently doing nothing.
 *   rng: () => number in [0, 1), injectable so runs can be reproduced.
 */
export function simulateProducerConsumer(bufferSize = 5, attempts = 10, rng = Math.random) {
  if (!Number.isInteger(bufferSize) || bufferSize < 1 || bufferSize > MAX_BUFFER) throw new Error(`Buffer size must be a whole number from 1 to ${MAX_BUFFER}`)
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > MAX_OPERATIONS) throw new Error(`Operations must be a whole number from 1 to ${MAX_OPERATIONS}`)

  const result = []
  const buffer = []
  let empty = bufferSize
  let full = 0
  let mutex = 1
  let itemId = 1

  const push = (attempt, actor, action, line, explanation, extra = {}) =>
    result.push({ buffer: [...buffer], empty, full, mutex, actor, action, attempt, highlightLine: line, explanation, ...extra })

  result.push({
    buffer: [], empty, full, mutex, actor: null, action: 'init', highlightLine: 0,
    explanation: `Buffer size = ${bufferSize}. Semaphores: empty=${bufferSize} (free slots), full=0 (items ready), mutex=1 (unlocked).`,
  })

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const producer = rng() < 0.55

    if (producer) {
      if (empty === 0) {
        push(attempt, 'producer', 'wait(empty)', 2,
          `Producer calls wait(empty), but empty is 0: the buffer is full. The producer BLOCKS (sleeps) until a consumer frees a slot.`, { blocked: true })
        continue
      }
      empty--
      push(attempt, 'producer', 'wait(empty)', 2, `Producer calls wait(empty). empty: ${empty + 1} → ${empty}. A slot is reserved, so the producer proceeds.`)
      mutex = 0
      push(attempt, 'producer', 'wait(mutex)', 3, `Producer acquires mutex (mutex: 1 → 0). Critical section entered; the consumer would have to wait.`)
      const item = `P${itemId++}`
      buffer.push(item)
      push(attempt, 'producer', `add(${item})`, 4, `Producer adds item "${item}" to the buffer. The buffer now holds ${buffer.length} item(s).`)
      mutex = 1
      push(attempt, 'producer', 'signal(mutex)', 5, `Producer releases mutex (mutex: 0 → 1). Critical section exited.`)
      full++
      push(attempt, 'producer', 'signal(full)', 6, `Producer signals full (full: ${full - 1} → ${full}). A waiting consumer can now proceed.`)
    } else {
      if (full === 0) {
        push(attempt, 'consumer', 'wait(full)', 8,
          `Consumer calls wait(full), but full is 0: the buffer is empty. The consumer BLOCKS (sleeps) until a producer adds an item.`, { blocked: true })
        continue
      }
      full--
      push(attempt, 'consumer', 'wait(full)', 8, `Consumer calls wait(full). full: ${full + 1} → ${full}. An item is reserved, so the consumer proceeds.`)
      mutex = 0
      push(attempt, 'consumer', 'wait(mutex)', 9, `Consumer acquires mutex (mutex: 1 → 0). Critical section entered.`)
      const item = buffer.shift()
      push(attempt, 'consumer', `remove(${item})`, 10, `Consumer removes "${item}" from the buffer (first in, first out). The buffer now holds ${buffer.length} item(s).`)
      mutex = 1
      push(attempt, 'consumer', 'signal(mutex)', 11, `Consumer releases mutex (mutex: 0 → 1). Critical section exited.`)
      empty++
      push(attempt, 'consumer', 'signal(empty)', 12, `Consumer signals empty (empty: ${empty - 1} → ${empty}). A waiting producer can now proceed.`)
    }
  }
  return result
}
