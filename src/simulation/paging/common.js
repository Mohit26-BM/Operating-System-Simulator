// Shared engine for the page replacement algorithms (FIFO, LRU, Optimal).
//
// Physical memory is a fixed array of frames. A page keeps the SAME frame for as long as it stays
// in memory, and a new page takes over the frame of the page it replaces, exactly as in a real
// OS. The TLB caches page -> frame translations (4 entries, least-recently-used replacement) and
// an entry is dropped the moment its page is evicted, so the TLB can never point at a stale frame.

export const TLB_SIZE = 4
export const MAX_FRAMES = 16
export const MAX_REFERENCES = 200

export function validatePagingInput(referenceString, frameCount) {
  if (!Array.isArray(referenceString) || referenceString.length === 0) throw new Error('Enter at least one page reference')
  if (referenceString.length > MAX_REFERENCES) throw new Error(`At most ${MAX_REFERENCES} references are supported`)
  if (!referenceString.every((n) => Number.isInteger(n) && n >= 0)) throw new Error('Page numbers must be whole numbers >= 0')
  if (!Number.isInteger(frameCount) || frameCount < 1 || frameCount > MAX_FRAMES) throw new Error(`Frames must be a whole number from 1 to ${MAX_FRAMES}`)
}

function touchTlb(tlb, page, frame) {
  const idx = tlb.findIndex((e) => e.page === page)
  if (idx !== -1) tlb.splice(idx, 1)
  tlb.unshift({ page, frame })
  if (tlb.length > TLB_SIZE) tlb.pop()
}

function dropFromTlb(tlb, page) {
  const idx = tlb.findIndex((e) => e.page === page)
  if (idx !== -1) tlb.splice(idx, 1)
}

const pageTableOf = (memory) =>
  memory.flatMap((page, frame) => (page === null ? [] : [{ page, frame, valid: true }]))

/**
 * policy = {
 *   onHit(state, page), onLoad(state, page),      // bookkeeping (load order, recency)
 *   victim(state, index) -> page,                  // which resident page to replace
 *   hitText(page, frame, tlbHit), faultText(page, frame, evicted, index, refs),
 *   lines: { hit, faultEvict, faultFree },
 * }
 */
export function runReplacement(referenceString, frameCount, policy) {
  validatePagingInput(referenceString, frameCount)
  const memory = new Array(frameCount).fill(null)
  const tlb = []
  const state = { memory, order: [], recent: [], refs: referenceString }
  const steps = []

  for (let i = 0; i < referenceString.length; i++) {
    const page = referenceString[i]
    const frame = memory.indexOf(page)

    if (frame !== -1) {
      const tlbHit = tlb.some((e) => e.page === page)
      touchTlb(tlb, page, frame)
      policy.onHit(state, page)
      steps.push({
        page, frame, memory: [...memory], event: 'hit', evicted: null,
        tlbHit, pageTable: pageTableOf(memory), tlb: tlb.map((e) => ({ ...e })),
        physicalAddress: `Frame ${frame}`,
        highlightLine: policy.lines.hit,
        explanation: policy.hitText(page, frame, tlbHit),
      })
      continue
    }

    let evicted = null
    let target = memory.indexOf(null)
    if (target === -1) {
      evicted = policy.victim(state, i)
      target = memory.indexOf(evicted)
      dropFromTlb(tlb, evicted)
    }
    memory[target] = page
    policy.onLoad(state, page, evicted)
    touchTlb(tlb, page, target)
    steps.push({
      page, frame: target, memory: [...memory], event: 'fault', evicted,
      tlbHit: false, pageTable: pageTableOf(memory), tlb: tlb.map((e) => ({ ...e })),
      physicalAddress: null,
      highlightLine: evicted !== null ? policy.lines.faultEvict : policy.lines.faultFree,
      explanation: policy.faultText(page, target, evicted, i, referenceString),
    })
  }
  return steps
}

/** Turns "7 0 1, 2" into { ok: true, pages: [7, 0, 1, 2] } or { ok: false, error } with a message fit to show the user. */
export function parseReferenceString(text) {
  const tokens = String(text ?? '').trim().split(/[\s,]+/).filter(Boolean)
  if (tokens.length === 0) return { ok: false, error: 'Enter at least one page number, for example 7 0 1 2 0 3' }
  const bad = tokens.find((t) => !/^\d+$/.test(t))
  if (bad !== undefined) return { ok: false, error: `"${bad}" is not a valid page number. Use whole numbers such as 3, separated by spaces.` }
  if (tokens.length > MAX_REFERENCES) return { ok: false, error: `At most ${MAX_REFERENCES} references are supported (you entered ${tokens.length}).` }
  const pages = tokens.map(Number)
  if (pages.some((n) => !Number.isSafeInteger(n))) return { ok: false, error: 'Page numbers are too large.' }
  return { ok: true, pages }
}
