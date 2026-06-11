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

export function simulateProducerConsumer(bufferSize = 5, steps = 10) {
  const result = []
  let buffer = []
  let empty = bufferSize
  let full = 0
  let mutex = 1

  result.push({
    buffer: [], empty, full, mutex,
    actor: null, action: 'init',
    highlightLine: 0,
    explanation: `Buffer size = ${bufferSize}. Semaphores: empty=${bufferSize} (free slots), full=0 (items ready), mutex=1 (unlocked).`,
  })

  let itemId = 1
  for (let i = 0; i < steps; i++) {
    const isProducer = Math.random() > 0.4 || full === 0

    if (isProducer && empty > 0) {
      // wait(empty)
      empty--
      result.push({
        buffer: [...buffer], empty, full, mutex: 0,
        actor: 'producer', action: 'wait(empty)',
        highlightLine: 2,
        explanation: `Producer calls wait(empty). empty: ${empty + 1} → ${empty}. Buffer has room — producer proceeds.`,
      })
      // wait(mutex)
      mutex = 0
      result.push({
        buffer: [...buffer], empty, full, mutex,
        actor: 'producer', action: 'wait(mutex)',
        highlightLine: 3,
        explanation: `Producer acquires mutex (mutex: 1 → 0). Critical section entered. Consumer must wait.`,
      })
      // produce
      const item = `P${itemId++}`
      buffer.push(item)
      result.push({
        buffer: [...buffer], empty, full, mutex,
        actor: 'producer', action: `add(${item})`,
        highlightLine: 4,
        explanation: `Producer adds item "${item}" to buffer. Buffer now has ${buffer.length} item(s).`,
      })
      // signal(mutex)
      mutex = 1
      result.push({
        buffer: [...buffer], empty, full, mutex,
        actor: 'producer', action: 'signal(mutex)',
        highlightLine: 5,
        explanation: `Producer releases mutex (mutex: 0 → 1). Critical section exited.`,
      })
      // signal(full)
      full++
      result.push({
        buffer: [...buffer], empty, full, mutex,
        actor: 'producer', action: 'signal(full)',
        highlightLine: 6,
        explanation: `Producer signals full (full: ${full - 1} → ${full}). Consumer can now consume if it was waiting.`,
      })
    } else if (!isProducer && full > 0) {
      // wait(full)
      full--
      result.push({
        buffer: [...buffer], empty, full, mutex: 0,
        actor: 'consumer', action: 'wait(full)',
        highlightLine: 8,
        explanation: `Consumer calls wait(full). full: ${full + 1} → ${full}. Buffer has items — consumer proceeds.`,
      })
      // wait(mutex)
      mutex = 0
      result.push({
        buffer: [...buffer], empty, full, mutex,
        actor: 'consumer', action: 'wait(mutex)',
        highlightLine: 9,
        explanation: `Consumer acquires mutex (mutex: 1 → 0). Critical section entered.`,
      })
      // consume
      const item = buffer.shift()
      result.push({
        buffer: [...buffer], empty, full, mutex,
        actor: 'consumer', action: `remove(${item})`,
        highlightLine: 10,
        explanation: `Consumer removes "${item}" from buffer. Buffer now has ${buffer.length} item(s).`,
      })
      // signal(mutex)
      mutex = 1
      result.push({
        buffer: [...buffer], empty, full, mutex,
        actor: 'consumer', action: 'signal(mutex)',
        highlightLine: 11,
        explanation: `Consumer releases mutex (mutex: 0 → 1). Critical section exited.`,
      })
      // signal(empty)
      empty++
      result.push({
        buffer: [...buffer], empty, full, mutex,
        actor: 'consumer', action: 'signal(empty)',
        highlightLine: 12,
        explanation: `Consumer signals empty (empty: ${empty - 1} → ${empty}). Producer can now produce if it was waiting.`,
      })
    }
  }

  return result
}
