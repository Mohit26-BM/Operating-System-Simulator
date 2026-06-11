export const FIFO_CODE = [
  'for each page in reference string:',
  '  if page in memory (TLB/page table):',
  '    record HIT — no action needed',
  '  else: PAGE FAULT',
  '    if free frame exists:',
  '      load page into free frame',
  '    else:',
  '      evict oldest loaded page (FIFO queue)',
  '      load new page into that frame',
  '  update TLB with latest mapping',
]

export const FIFO_ANNOTATIONS = {
  2: 'TLB checked first, then page table',
  7: 'FIFO — first loaded is first evicted',
  9: 'TLB holds last 4 mappings',
}

export function fifo(referenceString, frameCount) {
  const memory = []
  const tlb = []
  const steps = []

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i]
    const frameIndex = memory.indexOf(page)
    const tlbHit = tlb.some(e => e.page === page)

    if (frameIndex !== -1) {
      if (!tlbHit) updateTLB(tlb, page, frameIndex)
      steps.push({
        page, memory: [...memory], event: 'hit', evicted: null,
        tlbHit, pageTable: buildPageTable(memory), tlb: [...tlb],
        physicalAddress: `Frame ${frameIndex}`,
        highlightLine: tlbHit ? 2 : 2,
        explanation: `Page ${page} is already in Frame ${frameIndex}. ${tlbHit ? 'TLB hit — found instantly.' : 'Page table hit — TLB updated.'}`,
      })
    } else {
      let evicted = null
      if (memory.length >= frameCount) {
        evicted = memory.shift()
        removeTLB(tlb, evicted)
      }
      memory.push(page)
      const newFrame = memory.indexOf(page)
      updateTLB(tlb, page, newFrame)
      steps.push({
        page, memory: [...memory], event: 'fault', evicted,
        tlbHit: false, pageTable: buildPageTable(memory), tlb: [...tlb],
        physicalAddress: null,
        highlightLine: evicted !== null ? 7 : 5,
        explanation: evicted !== null
          ? `Page fault! Page ${page} not in memory. Evicted Page ${evicted} (oldest) and loaded Page ${page} into Frame ${newFrame}.`
          : `Page fault! Page ${page} not in memory. Loaded into free Frame ${newFrame}.`,
      })
    }
  }

  return steps
}

function buildPageTable(memory) {
  return memory.map((page, frame) => ({ page, frame, valid: true }))
}
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
