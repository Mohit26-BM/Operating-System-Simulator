export const FIRST_FIT_CODE = [
  'for each request size:',
  '  for each block in order:',
  '    if block.free AND block.size >= request:',
  '      allocate block to request',
  '      break   ← stop at first fit',
  '  if no block found:',
  '    request fails (no space)',
]

export const BEST_FIT_CODE = [
  'for each request size:',
  '  best = null',
  '  for each block:',
  '    if block.free AND block.size >= request:',
  '      if best == null OR block.size < best.size:',
  '        best = block   ← smallest sufficient',
  '  if best found: allocate best',
  '  else: request fails',
]

export const WORST_FIT_CODE = [
  'for each request size:',
  '  worst = null',
  '  for each block:',
  '    if block.free AND block.size >= request:',
  '      if worst == null OR block.size > worst.size:',
  '        worst = block  ← largest available',
  '  if worst found: allocate worst',
  '  else: request fails',
]

export const ANNOTATIONS = {
  firstFit:  { 4: 'Stops immediately — fast but may skip better fits' },
  bestFit:   { 5: 'Leaves smallest fragments — minimizes wasted space per allocation' },
  worstFit:  { 5: 'Leaves largest fragments — maximizes remaining space for future requests' },
}

export const DEFAULT_BLOCKS = [
  { id: 0, size: 100 },
  { id: 1, size: 500 },
  { id: 2, size: 200 },
  { id: 3, size: 300 },
  { id: 4, size: 600 },
]

export const DEFAULT_REQUESTS = [212, 417, 112, 426]

function applyAllocation(blocks, reqSize, strategy) {
  const free = blocks.map((b, i) => ({ ...b, idx: i })).filter(b => b.free && b.size >= reqSize)
  if (free.length === 0) return null

  if (strategy === 'firstFit') return free[0].idx
  if (strategy === 'bestFit')  return free.reduce((best, b) => b.size < free[best === null ? 0 : best].size ? b.idx : (best ?? b.idx), null)
  if (strategy === 'worstFit') return free.reduce((worst, b) => b.size > free[worst === null ? 0 : worst].size ? b.idx : (worst ?? b.idx), null)
  return null
}

function runStrategy(initialBlocks, requests, strategy) {
  const steps = []
  const blocks = initialBlocks.map(b => ({ ...b, free: true, allocatedTo: null }))

  for (let r = 0; r < requests.length; r++) {
    const reqSize = requests[r]
    const highlight = []

    // Scan phase — mark each candidate
    const candidates = blocks
      .map((b, i) => ({ ...b, idx: i }))
      .filter(b => b.free && b.size >= reqSize)

    if (candidates.length === 0) {
      steps.push({
        requestIdx: r, reqSize,
        blocks: blocks.map(b => ({ ...b })),
        chosenIdx: null,
        highlight: [],
        result: 'fail',
        explanation: `Request ${reqSize} KB failed — no free block large enough.`,
        why: 'External fragmentation: free memory exists but not in a single contiguous block large enough.',
        highlightLine: 6,
      })
      continue
    }

    let chosenIdx
    if (strategy === 'firstFit') {
      chosenIdx = candidates[0].idx
    } else if (strategy === 'bestFit') {
      chosenIdx = candidates.reduce((best, b) => b.size < candidates.find(c => c.idx === best).size ? b.idx : best, candidates[0].idx)
    } else {
      chosenIdx = candidates.reduce((worst, b) => b.size > candidates.find(c => c.idx === worst).size ? b.idx : worst, candidates[0].idx)
    }

    // Scan step
    steps.push({
      requestIdx: r, reqSize,
      blocks: blocks.map(b => ({ ...b })),
      chosenIdx: null,
      highlight: candidates.map(c => c.idx),
      result: 'scanning',
      explanation: `Scanning for a block ≥ ${reqSize} KB. Found ${candidates.length} candidate${candidates.length > 1 ? 's' : ''}.`,
      why: strategy === 'firstFit'
        ? 'First Fit stops at the first valid block — fast, but may fragment early blocks.'
        : strategy === 'bestFit'
        ? 'Best Fit checks all candidates and picks the tightest fit.'
        : 'Worst Fit checks all candidates and picks the largest one.',
      highlightLine: strategy === 'firstFit' ? 2 : 2,
    })

    // Allocate step
    blocks[chosenIdx].free = false
    blocks[chosenIdx].allocatedTo = `P${r + 1}`
    const fragLeft = blocks[chosenIdx].size - reqSize

    steps.push({
      requestIdx: r, reqSize,
      blocks: blocks.map(b => ({ ...b })),
      chosenIdx,
      highlight: [chosenIdx],
      result: 'success',
      explanation: `Allocated ${reqSize} KB into Block ${chosenIdx} (${blocks[chosenIdx].size} KB). Internal fragment: ${fragLeft} KB.`,
      why: fragLeft === 0
        ? 'Perfect fit — zero wasted space.'
        : `${fragLeft} KB of the block goes unused (internal fragmentation).`,
      highlightLine: strategy === 'firstFit' ? 3 : 6,
    })
  }

  return steps
}

export function runMemoryAllocation(blocks, requests) {
  return {
    firstFit:  runStrategy(blocks, requests, 'firstFit'),
    bestFit:   runStrategy(blocks, requests, 'bestFit'),
    worstFit:  runStrategy(blocks, requests, 'worstFit'),
  }
}
