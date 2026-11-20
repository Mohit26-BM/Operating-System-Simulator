// Dynamic (variable-size) memory allocation, the way a real allocator works:
//   - a request is carved out of a free "hole", leaving the rest of the hole free (splitting),
//   - a freed block merges with free neighbours (coalescing),
//   - over time free memory breaks into many small holes (external fragmentation), and a request can
//     fail even though enough memory is free in total; compaction slides everything together.
// Strategies choose WHICH hole to use: First Fit, Best Fit, Worst Fit, Next Fit.

export const STRATEGIES = ['First Fit', 'Best Fit', 'Worst Fit', 'Next Fit']
export const MAX_OPS = 40
export const MIN_MEMORY = 16
export const MAX_MEMORY = 4096

export const DYNAMIC_CODE = {
  'First Fit': [
    'on alloc(name, size):',
    '  for each hole from the lowest address:',
    '    if hole.size >= size: use it (stop at the first)',
    '  split the hole: [allocated | remaining hole]',
    '  if no hole is big enough: the request fails',
    'on free(name): mark the block free and merge with free neighbours',
  ],
  'Best Fit': [
    'on alloc(name, size):',
    '  scan ALL holes; remember the smallest with hole.size >= size',
    '  use that hole (ties: lowest address)',
    '  split the hole: [allocated | remaining hole]',
    '  if no hole is big enough: the request fails',
    'on free(name): mark the block free and merge with free neighbours',
  ],
  'Worst Fit': [
    'on alloc(name, size):',
    '  scan ALL holes; remember the largest with hole.size >= size',
    '  use that hole (ties: lowest address)',
    '  split the hole: [allocated | remaining hole]',
    '  if no hole is big enough: the request fails',
    'on free(name): mark the block free and merge with free neighbours',
  ],
  'Next Fit': [
    'on alloc(name, size):',
    '  start where the last allocation ended and move upward, wrapping around',
    '    if hole.size >= size: use it (stop at the first)',
    '  split the hole: [allocated | remaining hole]',
    '  if no hole is big enough: the request fails',
    'on free(name): mark the block free and merge with free neighbours',
  ],
}

export const DYNAMIC_ANNOTATIONS = {
  'First Fit': { 1: 'fast, but small leftover holes pile up at the start of memory', 3: 'splitting leaves the unused part as a new, smaller hole', 5: 'coalescing is what keeps free memory usable' },
  'Best Fit': { 1: 'slower (scans everything) and leaves many tiny, nearly useless holes', 3: 'the leftover is as small as possible', 5: 'coalescing is what keeps free memory usable' },
  'Worst Fit': { 1: 'keeps the leftover as large as possible, but destroys the big holes that large requests need', 3: 'the leftover is as large as possible', 5: 'coalescing is what keeps free memory usable' },
  'Next Fit': { 1: 'spreads allocations across memory instead of crowding the start', 3: 'splitting leaves the unused part as a new hole', 5: 'coalescing is what keeps free memory usable' },
}

/** "A 100, B 200, free A, compact" -> { ok, ops }. Separators: commas, semicolons or new lines. */
export function parseScript(text) {
  const parts = String(text ?? '').split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return { ok: false, error: 'Enter at least one operation, for example: A 100, B 200, free A' }
  if (parts.length > MAX_OPS) return { ok: false, error: `At most ${MAX_OPS} operations are supported (you entered ${parts.length})` }
  const ops = []
  for (const part of parts) {
    const words = part.split(/\s+/)
    const head = words[0].toLowerCase()
    if (head === 'compact' && words.length === 1) { ops.push({ type: 'compact' }); continue }
    if (head === 'free' && words.length === 2 && /^[A-Za-z][A-Za-z0-9_]{0,7}$/.test(words[1])) { ops.push({ type: 'free', name: words[1] }); continue }
    const w = head === 'alloc' ? words.slice(1) : words
    if (w.length === 2 && /^[A-Za-z][A-Za-z0-9_]{0,7}$/.test(w[0]) && /^\d+$/.test(w[1])) {
      const size = Number(w[1])
      if (size < 1 || size > MAX_MEMORY) return { ok: false, error: `"${part}": the size must be between 1 and ${MAX_MEMORY}` }
      if (w[0].toLowerCase() === 'free' || w[0].toLowerCase() === 'compact') return { ok: false, error: `"${w[0]}" is a command and cannot be a process name` }
      ops.push({ type: 'alloc', name: w[0], size })
      continue
    }
    return { ok: false, error: `Cannot read "${part}". Use "NAME SIZE" to allocate, "free NAME" to release, or "compact".` }
  }
  return { ok: true, ops }
}

function validate(size, ops, strategy) {
  if (!STRATEGIES.includes(strategy)) throw new Error(`Unknown strategy "${strategy}"`)
  if (!Number.isInteger(size) || size < MIN_MEMORY || size > MAX_MEMORY) throw new Error(`Memory size must be a whole number from ${MIN_MEMORY} to ${MAX_MEMORY}`)
  if (!Array.isArray(ops) || ops.length === 0) throw new Error('Enter at least one operation')
  if (ops.length > MAX_OPS) throw new Error(`At most ${MAX_OPS} operations are supported`)
}

export function memoryStats(segments, size) {
  const holes = segments.filter((s) => s.owner === null)
  const totalFree = holes.reduce((a, s) => a + s.size, 0)
  const largestHole = holes.reduce((a, s) => Math.max(a, s.size), 0)
  return {
    totalFree, largestHole, holes: holes.length, used: size - totalFree,
    // share of free memory that cannot be used by one big request: 0 = all free memory is one block
    externalFragmentation: totalFree > 0 ? Math.round((1 - largestHole / totalFree) * 100) : 0,
    utilization: Math.round(((size - totalFree) / size) * 100),
  }
}

function mergeHoles(segments) {
  const out = []
  for (const s of segments) {
    const last = out[out.length - 1]
    if (last && last.owner === null && s.owner === null) last.size += s.size
    else out.push({ ...s })
  }
  return out
}

export function simulateDynamic({ size, ops, strategy }) {
  validate(size, ops, strategy)
  let segments = [{ start: 0, size, owner: null }]
  let nextPtr = 0                       // Next Fit: where the previous allocation ended
  const steps = []
  const stats = () => memoryStats(segments, size)
  const snap = (extra) => ({ segments: segments.map((s) => ({ ...s })), stats: stats(), strategy, ...extra })

  steps.push(snap({
    op: null, result: 'init', highlightLine: -1, chosenStart: null, considered: [],
    explanation: `Memory is one free hole of ${size} KB. Strategy: ${strategy}. Requests are carved out of holes; freed blocks merge with free neighbours.`,
  }))

  const holesOf = () => segments.filter((s) => s.owner === null)

  ops.forEach((op, i) => {
    const label = op.type === 'alloc' ? `alloc ${op.name} ${op.size}` : op.type === 'free' ? `free ${op.name}` : 'compact'

    if (op.type === 'alloc') {
      if (segments.some((s) => s.owner === op.name)) {
        steps.push(snap({ op: label, opIndex: i, result: 'error', highlightLine: 0, chosenStart: null, considered: [], explanation: `${op.name} is already in memory, so "${label}" is ignored. Free it first.` }))
        return
      }
      const holes = holesOf()
      const fits = holes.filter((h) => h.size >= op.size)
      let chosen = null
      if (fits.length) {
        if (strategy === 'First Fit') chosen = fits[0]
        else if (strategy === 'Best Fit') chosen = fits.reduce((a, b) => (b.size < a.size ? b : a))
        else if (strategy === 'Worst Fit') chosen = fits.reduce((a, b) => (b.size > a.size ? b : a))
        else chosen = fits.find((h) => h.start >= nextPtr) ?? fits[0]      // Next Fit: continue from the last allocation, then wrap
      }

      if (!chosen) {
        const st = stats()
        const frag = st.totalFree >= op.size
        steps.push(snap({
          op: label, opIndex: i, result: 'fail', highlightLine: 4, chosenStart: null, considered: holes.map((h) => h.start),
          explanation: `${op.name} (${op.size} KB) cannot be placed: the largest hole is ${st.largestHole} KB.`,
          why: frag
            ? `External fragmentation: ${st.totalFree} KB is free in total, spread over ${st.holes} hole${st.holes === 1 ? '' : 's'}, but a request needs one contiguous block. Compaction would fix this.`
            : `Out of memory: only ${st.totalFree} KB is free but ${op.size} KB is needed.`,
        }))
        return
      }

      const index = segments.indexOf(chosen)
      const rest = chosen.size - op.size
      const replacement = [{ start: chosen.start, size: op.size, owner: op.name }]
      if (rest > 0) replacement.push({ start: chosen.start + op.size, size: rest, owner: null })
      segments = [...segments.slice(0, index), ...replacement, ...segments.slice(index + 1)]
      nextPtr = chosen.start + op.size
      if (nextPtr >= size) nextPtr = 0
      steps.push(snap({
        op: label, opIndex: i, result: 'ok', highlightLine: strategy === 'First Fit' || strategy === 'Next Fit' ? 2 : 1, chosenStart: chosen.start,
        considered: (strategy === 'First Fit' || strategy === 'Next Fit' ? fits.slice(0, 1) : holes).map((h) => h.start),
        explanation: `${op.name} (${op.size} KB) goes into the hole at ${chosen.start} (${chosen.size} KB).${rest > 0 ? ` The hole is split: ${rest} KB stays free at ${chosen.start + op.size}.` : ' It fits exactly, so no hole is left.'}`,
        why: strategy === 'First Fit' ? 'First Fit takes the first hole that is big enough.'
          : strategy === 'Best Fit' ? `Best Fit picked the smallest hole that fits (${chosen.size} KB among ${fits.length} candidate${fits.length === 1 ? '' : 's'}).`
          : strategy === 'Worst Fit' ? `Worst Fit picked the largest hole (${chosen.size} KB among ${fits.length} candidate${fits.length === 1 ? '' : 's'}).`
          : 'Next Fit continued from the end of the previous allocation.',
      }))
      return
    }

    if (op.type === 'free') {
      const target = segments.find((s) => s.owner === op.name)
      if (!target) {
        steps.push(snap({ op: label, opIndex: i, result: 'error', highlightLine: 5, chosenStart: null, considered: [], explanation: `${op.name} is not in memory (it was never allocated, the request failed, or it was already freed), so "${label}" is ignored.` }))
        return
      }
      const before = holesOf().length
      target.owner = null
      segments = mergeHoles(segments)
      const merged = segments.find((s) => s.owner === null && s.start <= target.start && s.start + s.size >= target.start + target.size)
      steps.push(snap({
        op: label, opIndex: i, result: 'ok', highlightLine: 5, chosenStart: merged?.start ?? target.start, considered: [],
        explanation: `${op.name} (${target.size} KB) is freed${merged && merged.size > target.size ? `. It merges with free neighbours into one ${merged.size} KB hole at ${merged.start} (coalescing).` : ', leaving a separate hole because both neighbours are in use.'}`,
        why: `${before + 1 - (holesOf().length)} merge${before + 1 - holesOf().length === 1 ? '' : 's'} happened; there ${holesOf().length === 1 ? 'is now 1 hole' : `are now ${holesOf().length} holes`}.`,
      }))
      return
    }

    // compact: slide every allocated block to the low end, keeping their order
    const used = segments.filter((s) => s.owner !== null)
    let cursor = 0
    let moved = 0, movedKb = 0
    const packed = used.map((s) => { const n = { ...s, start: cursor }; if (n.start !== s.start) { moved++; movedKb += s.size } cursor += s.size; return n })
    if (cursor < size) packed.push({ start: cursor, size: size - cursor, owner: null })
    segments = packed
    steps.push(snap({
      op: label, opIndex: i, result: 'ok', highlightLine: -1, chosenStart: null, considered: [],
      explanation: moved ? `Compaction slides ${moved} block${moved === 1 ? '' : 's'} (${movedKb} KB copied) toward address 0, leaving one free hole of ${size - cursor} KB at the end.` : 'Nothing to move: the allocated blocks already sit together at the start.',
      why: 'Compaction needs all programs to be relocatable and costs a lot of copying, which is why real systems avoid it (paging removes the need).',
    }))
  })
  return steps
}
