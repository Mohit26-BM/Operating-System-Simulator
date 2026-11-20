// The buddy allocator (used inside the Linux kernel for physical pages).
// Memory is a power of two. A request is rounded UP to a power of two (internal fragmentation);
// a larger free block is split in halves until it fits; a freed block merges with its "buddy"
// (the other half it was split from) whenever the buddy is free too.

import { parseScript, MAX_OPS } from './dynamic'

export const BUDDY_CODE = [
  'on alloc(name, size):',
  '  need = size rounded UP to a power of two (at least the minimum block)',
  '  find the smallest free block >= need (lowest address first)',
  '  while block is bigger than need: split it into two buddies, keep the lower half',
  '  if no free block is large enough: the request fails',
  'on free(name):',
  '  while the buddy block is also free: merge the pair into one larger block',
]

export const BUDDY_ANNOTATIONS = {
  1: 'rounding up wastes memory inside the block: internal fragmentation, up to almost 50%',
  3: 'a buddy is found by flipping one address bit, so merging is very fast',
  6: 'buddies merge repeatedly, so freeing everything restores the original single block',
}

export const BUDDY_SIZES = [64, 128, 256, 512, 1024, 2048, 4096]

export { parseScript }

const isPow2 = (n) => Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0
const roundUp = (n, min) => { let s = min; while (s < n) s *= 2; return s }

export function buddyStats(blocks, size) {
  const free = blocks.filter((b) => b.owner === null)
  const allocated = blocks.filter((b) => b.owner !== null)
  const totalFree = free.reduce((a, b) => a + b.size, 0)
  const largestHole = free.reduce((a, b) => Math.max(a, b.size), 0)
  const requested = allocated.reduce((a, b) => a + b.requested, 0)
  const reserved = allocated.reduce((a, b) => a + b.size, 0)
  return {
    totalFree, largestHole, holes: free.length, used: reserved,
    externalFragmentation: totalFree > 0 ? Math.round((1 - largestHole / totalFree) * 100) : 0,
    utilization: Math.round((reserved / size) * 100),
    internalFragmentation: reserved - requested,                                  // KB reserved but not asked for
    internalPercent: reserved > 0 ? Math.round(((reserved - requested) / reserved) * 100) : 0,
  }
}

export function simulateBuddy({ size, ops, minBlock = 16 }) {
  if (!isPow2(size) || size < 64 || size > 4096) throw new Error('The buddy allocator needs a memory size that is a power of two from 64 to 4096')
  if (!isPow2(minBlock) || minBlock < 4 || minBlock > size) throw new Error('The minimum block must be a power of two no larger than memory')
  if (!Array.isArray(ops) || ops.length === 0) throw new Error('Enter at least one operation')
  if (ops.length > MAX_OPS) throw new Error(`At most ${MAX_OPS} operations are supported`)

  let blocks = [{ start: 0, size, owner: null, requested: 0 }]
  const steps = []
  const snap = (extra) => ({ segments: blocks.map((b) => ({ ...b })), stats: buddyStats(blocks, size), strategy: 'Buddy', ...extra })
  const sorted = () => blocks.sort((a, b) => a.start - b.start)

  steps.push(snap({
    op: null, result: 'init', highlightLine: -1, chosenStart: null, considered: [],
    explanation: `Memory is one free block of ${size} KB. Blocks come in powers of two (minimum ${minBlock} KB) and every block is aligned to its own size.`,
  }))

  ops.forEach((op, i) => {
    if (op.type === 'compact') {
      steps.push(snap({ op: 'compact', opIndex: i, result: 'error', highlightLine: -1, chosenStart: null, considered: [], explanation: 'The buddy allocator never compacts: blocks cannot move. The command is ignored.' }))
      return
    }
    const label = op.type === 'alloc' ? `alloc ${op.name} ${op.size}` : `free ${op.name}`

    if (op.type === 'alloc') {
      if (blocks.some((b) => b.owner === op.name)) {
        steps.push(snap({ op: label, opIndex: i, result: 'error', highlightLine: 0, chosenStart: null, considered: [], explanation: `${op.name} is already in memory, so "${label}" is ignored.` }))
        return
      }
      const need = roundUp(op.size, minBlock)
      const free = sorted().filter((b) => b.owner === null && b.size >= need)
      if (need > size || free.length === 0) {
        const st = buddyStats(blocks, size)
        steps.push(snap({
          op: label, opIndex: i, result: 'fail', highlightLine: 4, chosenStart: null, considered: [],
          explanation: `${op.name} needs a ${need} KB block (${op.size} KB rounded up) but none is free.`,
          why: need > size ? `${need} KB is larger than all of memory (${size} KB).` : `Only ${st.totalFree} KB is free and the largest free block is ${st.largestHole} KB.`,
        }))
        return
      }
      const smallest = free.reduce((a, b) => (b.size < a.size ? b : a))     // smallest sufficient block, lowest address on ties (list is sorted)
      let block = smallest
      const splits = []
      while (block.size > need) {
        const half = block.size / 2
        const upper = { start: block.start + half, size: half, owner: null, requested: 0 }
        block.size = half
        blocks.push(upper)
        splits.push(`${half * 2} KB → two ${half} KB`)
      }
      block.owner = op.name
      block.requested = op.size
      sorted()
      steps.push(snap({
        op: label, opIndex: i, result: 'ok', highlightLine: splits.length ? 3 : 2, chosenStart: block.start, considered: free.map((b) => b.start),
        explanation: `${op.name} (${op.size} KB) is rounded up to ${need} KB and placed at ${block.start}.${splits.length ? ` To get that size the allocator split: ${splits.join(', then ')}.` : ' A free block of exactly that size was available.'}`,
        why: need === op.size ? 'The request is exactly a power of two: no internal fragmentation.' : `${need - op.size} KB inside the block is wasted (internal fragmentation).`,
      }))
      return
    }

    const target = blocks.find((b) => b.owner === op.name)
    if (!target) {
      steps.push(snap({ op: label, opIndex: i, result: 'error', highlightLine: 5, chosenStart: null, considered: [], explanation: `${op.name} is not in memory, so "${label}" is ignored.` }))
      return
    }
    target.owner = null
    target.requested = 0
    const merges = []
    for (;;) {
      const buddyStart = target.start ^ target.size
      const buddy = blocks.find((b) => b.start === buddyStart && b.size === target.size && b.owner === null && b !== target)
      if (!buddy) break
      const lower = Math.min(target.start, buddy.start)
      blocks = blocks.filter((b) => b !== target && b !== buddy)
      target.start = lower
      target.size *= 2
      blocks.push(target)
      merges.push(`two ${target.size / 2} KB → ${target.size} KB`)
    }
    sorted()
    steps.push(snap({
      op: label, opIndex: i, result: 'ok', highlightLine: 6, chosenStart: target.start, considered: [],
      explanation: `${op.name} is freed.${merges.length ? ` Its buddy was free, so the allocator merged: ${merges.join(', then ')}.` : ' Its buddy is still in use, so the block stays separate.'}`,
      why: merges.length ? 'Merging buddies rebuilds large blocks, so big requests can succeed again.' : 'Without a free buddy there is nothing to merge with.',
    }))
  })
  return steps
}
