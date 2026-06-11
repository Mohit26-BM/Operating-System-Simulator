export const RACE_CODE = [
  'shared = 0',
  'Thread A: temp_a = read(shared)   // sees 0',
  'Thread B: temp_b = read(shared)   // sees 0  ← context switch!',
  'Thread A: temp_a = temp_a + 1     // local = 1',
  'Thread B: temp_b = temp_b + 1     // local = 1',
  'Thread A: write(shared, temp_a)   // shared = 1',
  'Thread B: write(shared, temp_b)   // shared = 1  ← overwrites A!',
  '// Expected: 2    Actual: 1   ← LOST UPDATE',
]

export const RACE_ANNOTATIONS = {
  2: 'OS preempted A before it could write',
  6: 'Both threads wrote 1 — A\'s increment was lost',
  7: 'Race condition: output depends on scheduling order',
}

export const MUTEX_CODE = [
  'shared = 0',
  'Thread A: lock(mutex)',
  'Thread A: temp_a = read(shared)   // sees 0',
  'Thread A: temp_a = temp_a + 1     // local = 1',
  'Thread A: write(shared, temp_a)   // shared = 1',
  'Thread A: unlock(mutex)',
  'Thread B: lock(mutex)             // was blocked, now acquires',
  'Thread B: temp_b = read(shared)   // sees 1',
  'Thread B: temp_b = temp_b + 1     // local = 2',
  'Thread B: write(shared, temp_b)   // shared = 2',
  'Thread B: unlock(mutex)',
  '// Expected: 2    Actual: 2   ✓ Correct',
]

export const MUTEX_ANNOTATIONS = {
  1: 'Lock acquired — B will block until A releases',
  5: 'Lock released — B can now proceed',
  6: 'B was unblocked by A\'s unlock',
  11: 'Mutex serialized access — no lost updates',
}

export function raceConditionSteps() {
  return [
    {
      phase: 'init', shared: 0, tempA: null, tempB: null,
      highlightLine: 0,
      explanation: 'Shared counter starts at 0. Both threads will try to increment it.',
      why: 'No protection in place — both threads can read/write the same variable at any time.',
      threadAState: 'idle', threadBState: 'idle', lockOwner: null, event: null,
    },
    {
      phase: 'A-read', shared: 0, tempA: 0, tempB: null,
      highlightLine: 1,
      explanation: 'Thread A reads shared = 0 into its local register (temp_a).',
      why: 'CPU register holds a copy of the value. The increment hasn\'t happened yet.',
      threadAState: 'active', threadBState: 'idle', lockOwner: null, event: 'A-read',
    },
    {
      phase: 'B-read', shared: 0, tempA: 0, tempB: 0,
      highlightLine: 2,
      explanation: 'OS preempts Thread A. Thread B runs and also reads shared = 0.',
      why: 'Context switch happened before A could write. Now both hold the stale value 0.',
      threadAState: 'idle', threadBState: 'active', lockOwner: null, event: 'context-switch',
    },
    {
      phase: 'A-inc', shared: 0, tempA: 1, tempB: 0,
      highlightLine: 3,
      explanation: 'Thread A (resumed) increments its local copy: temp_a = 0 + 1 = 1.',
      why: 'Only the local register changes — shared memory is still 0.',
      threadAState: 'active', threadBState: 'idle', lockOwner: null, event: 'A-inc',
    },
    {
      phase: 'B-inc', shared: 0, tempA: 1, tempB: 1,
      highlightLine: 4,
      explanation: 'Thread B increments its stale copy: temp_b = 0 + 1 = 1.',
      why: 'B started from 0, not 1. It never saw A\'s work.',
      threadAState: 'idle', threadBState: 'active', lockOwner: null, event: 'B-inc',
    },
    {
      phase: 'A-write', shared: 1, tempA: 1, tempB: 1,
      highlightLine: 5,
      explanation: 'Thread A writes temp_a = 1 to shared.',
      why: 'shared is now 1. This is correct so far — but B is about to overwrite it.',
      threadAState: 'active', threadBState: 'idle', lockOwner: null, event: 'A-write',
    },
    {
      phase: 'B-write', shared: 1, tempA: 1, tempB: 1,
      highlightLine: 6,
      explanation: 'Thread B writes temp_b = 1 to shared — overwriting A\'s result.',
      why: 'B computed from a stale 0. It wrote 1 again, not 2. A\'s increment is gone.',
      threadAState: 'idle', threadBState: 'active', lockOwner: null, event: 'race-result',
    },
    {
      phase: 'result', shared: 1, tempA: 1, tempB: 1,
      highlightLine: 7,
      explanation: 'Final result: shared = 1. Expected 2. One increment was silently lost.',
      why: 'Race condition: the output depends on the exact order of OS scheduling — not on program logic.',
      threadAState: 'done', threadBState: 'done', lockOwner: null, event: 'race-bug',
    },
  ]
}

export function mutexSteps() {
  return [
    {
      phase: 'init', shared: 0, tempA: null, tempB: null, lockOwner: null,
      highlightLine: 0,
      explanation: 'Shared counter = 0. A mutex protects the read-modify-write sequence.',
      why: 'Mutex = mutual exclusion object. Only one thread can hold it at a time.',
      threadAState: 'idle', threadBState: 'idle', event: null,
    },
    {
      phase: 'A-lock', shared: 0, tempA: null, tempB: null, lockOwner: 'A',
      highlightLine: 1,
      explanation: 'Thread A acquires the mutex. Lock is free so it succeeds immediately.',
      why: 'Thread B will block the moment it tries to lock — it must wait for A to release.',
      threadAState: 'active', threadBState: 'blocked', event: 'lock',
    },
    {
      phase: 'A-read', shared: 0, tempA: 0, tempB: null, lockOwner: 'A',
      highlightLine: 2,
      explanation: 'Thread A reads shared = 0 (holding the lock).',
      why: 'Safe to read: no other thread can enter the critical section right now.',
      threadAState: 'active', threadBState: 'blocked', event: 'A-read',
    },
    {
      phase: 'A-inc', shared: 0, tempA: 1, tempB: null, lockOwner: 'A',
      highlightLine: 3,
      explanation: 'Thread A increments: temp_a = 0 + 1 = 1.',
      why: 'The OS can still preempt A here, but B cannot enter the critical section.',
      threadAState: 'active', threadBState: 'blocked', event: 'A-inc',
    },
    {
      phase: 'A-write', shared: 1, tempA: 1, tempB: null, lockOwner: 'A',
      highlightLine: 4,
      explanation: 'Thread A writes 1 to shared.',
      why: 'Write completes. shared is now correctly 1.',
      threadAState: 'active', threadBState: 'blocked', event: 'A-write',
    },
    {
      phase: 'A-unlock', shared: 1, tempA: 1, tempB: null, lockOwner: null,
      highlightLine: 5,
      explanation: 'Thread A releases the mutex. B is unblocked.',
      why: 'Releasing the lock signals Thread B that the critical section is available.',
      threadAState: 'done', threadBState: 'idle', event: 'unlock',
    },
    {
      phase: 'B-lock', shared: 1, tempA: 1, tempB: null, lockOwner: 'B',
      highlightLine: 6,
      explanation: 'Thread B acquires the mutex (was waiting, now gets it).',
      why: 'B enters the critical section after A has fully completed its update.',
      threadAState: 'done', threadBState: 'active', event: 'lock',
    },
    {
      phase: 'B-read', shared: 1, tempA: 1, tempB: 1, lockOwner: 'B',
      highlightLine: 7,
      explanation: 'Thread B reads shared = 1 — the value A already wrote.',
      why: 'No stale data: B reads after A\'s write is fully committed.',
      threadAState: 'done', threadBState: 'active', event: 'B-read',
    },
    {
      phase: 'B-inc', shared: 1, tempA: 1, tempB: 2, lockOwner: 'B',
      highlightLine: 8,
      explanation: 'Thread B increments: temp_b = 1 + 1 = 2.',
      why: 'Correctly starts from 1, not the stale 0.',
      threadAState: 'done', threadBState: 'active', event: 'B-inc',
    },
    {
      phase: 'B-write', shared: 2, tempA: 1, tempB: 2, lockOwner: 'B',
      highlightLine: 9,
      explanation: 'Thread B writes 2 to shared.',
      why: 'Both increments are reflected: 0 → 1 → 2.',
      threadAState: 'done', threadBState: 'active', event: 'B-write',
    },
    {
      phase: 'B-unlock', shared: 2, tempA: 1, tempB: 2, lockOwner: null,
      highlightLine: 10,
      explanation: 'Thread B releases the mutex.',
      why: 'Critical section complete. Another thread could now acquire the lock.',
      threadAState: 'done', threadBState: 'done', event: 'unlock',
    },
    {
      phase: 'result', shared: 2, tempA: 1, tempB: 2, lockOwner: null,
      highlightLine: 11,
      explanation: 'Final result: shared = 2. Correct!',
      why: 'Mutex serialized the critical section — both increments executed atomically in sequence.',
      threadAState: 'done', threadBState: 'done', event: 'mutex-correct',
    },
  ]
}
