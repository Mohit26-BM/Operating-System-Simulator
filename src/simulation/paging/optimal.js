export const OPTIMAL_CODE = [
  'for each page in reference string:',
  '  if page in memory: HIT',
  '  else: PAGE FAULT',
  '    if free frame exists:',
  '      load page into free frame',
  '    else:',
  '      look ahead in reference string',
  '      find page used furthest in future',
  '      evict that page (or one never used again)',
  '      load new page',
  '  update TLB',
]

export const OPTIMAL_ANNOTATIONS = {
  6: 'requires future knowledge — impossible in real OS',
  7: 'page never referenced again → ideal eviction',
  8: 'theoretical minimum fault count',
}

export function optimal(referenceString, frameCount) {
  const memory = []
  const tlb = []
  const steps = []

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i]
    const idx = memory.indexOf(page)
    const tlbHit = tlb.some(e => e.page === page)

    if (idx !== -1) {
      updateTLB(tlb, page, idx)
      steps.push({
        page, memory: [...memory], event: 'hit', evicted: null,
        tlbHit, pageTable: buildPageTable(memory), tlb: [...tlb],
        physicalAddress: `Frame ${idx}`,
        highlightLine: 1,
        explanation: `Page ${page} is in memory. Hit! ${tlbHit ? 'TLB hit.' : 'TLB updated.'}`,
      })
    } else {
      let evicted = null
      if (memory.length >= frameCount) {
        evicted = getOptimalEvict(memory, referenceString, i)
        memory.splice(memory.indexOf(evicted), 1)
        removeTLB(tlb, evicted)
      }
      memory.push(page)
      updateTLB(tlb, page, memory.indexOf(page))
      const nextUse = referenceString.indexOf(page, i + 1)
      steps.push({
        page, memory: [...memory], event: 'fault', evicted,
        tlbHit: false, pageTable: buildPageTable(memory), tlb: [...tlb],
        physicalAddress: null,
        highlightLine: evicted !== null ? 8 : 4,
        explanation: evicted !== null
          ? `Page fault! Optimal evicts Page ${evicted} (next used at index ${referenceString.indexOf(evicted, i + 1) === -1 ? 'never' : referenceString.indexOf(evicted, i + 1)}). Page ${page} next used at ${nextUse === -1 ? 'never' : nextUse}.`
          : `Page fault! Free frame available. Loaded Page ${page}.`,
      })
    }
  }

  return steps
}

function getOptimalEvict(memory, ref, currentIndex) {
  let farthest = -1, evict = memory[0]
  for (const page of memory) {
    const next = ref.indexOf(page, currentIndex + 1)
    const dist = next === -1 ? Infinity : next
    if (dist > farthest) { farthest = dist; evict = page }
  }
  return evict
}
function buildPageTable(m) { return m.map((page, frame) => ({ page, frame, valid: true })) }
function updateTLB(tlb, page, frame) {
  const idx = tlb.findIndex(e => e.page === page)
  if (idx !== -1) tlb.splice(idx, 1)
  tlb.unshift({ page, frame })
  if (tlb.length > 4) tlb.pop()
}
function removeTLB(tlb, page) {
  const idx = tlb.findIndex(e => e.page === page)
  if (idx !== -1) tlb.splice(idx, 1)
}
