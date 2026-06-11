export const LRU_CODE = [
  'for each page in reference string:',
  '  if page in memory:',
  '    move page to "most recently used" position',
  '    record HIT',
  '  else: PAGE FAULT',
  '    if free frame exists:',
  '      load page into free frame',
  '    else:',
  '      evict page at "least recently used" position',
  '      load new page, mark as most recent',
  '  update TLB',
]

export const LRU_ANNOTATIONS = {
  2: 'front = most recent, back = least recent',
  8: 'LRU — back of usage list is evicted',
  9: 'newly loaded becomes most recent',
}

export function lru(referenceString, frameCount) {
  const memory = []
  const tlb = []
  const steps = []

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i]
    const idx = memory.indexOf(page)
    const tlbHit = tlb.some(e => e.page === page)

    if (idx !== -1) {
      memory.splice(idx, 1)
      memory.push(page)
      updateTLB(tlb, page, memory.indexOf(page))
      steps.push({
        page, memory: [...memory], event: 'hit', evicted: null,
        tlbHit, pageTable: buildPageTable(memory), tlb: [...tlb],
        physicalAddress: `Frame ${memory.indexOf(page)}`,
        highlightLine: 2,
        explanation: `Page ${page} hit. Moved to most-recently-used position. ${tlbHit ? 'TLB hit.' : 'TLB updated.'}`,
      })
    } else {
      let evicted = null
      if (memory.length >= frameCount) {
        evicted = memory.shift()
        removeTLB(tlb, evicted)
      }
      memory.push(page)
      updateTLB(tlb, page, memory.indexOf(page))
      steps.push({
        page, memory: [...memory], event: 'fault', evicted,
        tlbHit: false, pageTable: buildPageTable(memory), tlb: [...tlb],
        physicalAddress: null,
        highlightLine: evicted !== null ? 8 : 6,
        explanation: evicted !== null
          ? `Page fault! Evicted Page ${evicted} (least recently used). Loaded Page ${page} as most recent.`
          : `Page fault! Free frame available. Loaded Page ${page}.`,
      })
    }
  }

  return steps
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
