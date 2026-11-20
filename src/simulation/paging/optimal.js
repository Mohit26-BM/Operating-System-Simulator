import { runReplacement } from './common'

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

function nextUse(refs, page, from) {
  const next = refs.indexOf(page, from)
  return next === -1 ? Infinity : next
}

export function optimal(referenceString, frameCount) {
  return runReplacement(referenceString, frameCount, {
    onHit() {},
    onLoad() {},
    // Evict the resident page whose next use is farthest away (never used again wins; ties go to the lowest frame).
    victim(state, index) {
      let best = null, bestDist = -1
      for (const page of state.memory) {
        if (page === null) continue
        const d = nextUse(state.refs, page, index + 1)
        if (d > bestDist) { best = page; bestDist = d }
      }
      return best
    },
    lines: { hit: 1, faultEvict: 8, faultFree: 4 },
    hitText: (page, frame, tlbHit) => `Page ${page} is in Frame ${frame}. Hit! ${tlbHit ? 'TLB hit.' : 'TLB updated.'}`,
    faultText: (page, frame, evicted, i, refs) => {
      if (evicted === null) return `Page fault! Free frame available. Loaded Page ${page} into Frame ${frame}.`
      const d = nextUse(refs, evicted, i + 1)
      const n = nextUse(refs, page, i + 1)
      return `Page fault! Optimal evicts Page ${evicted} (next used at index ${d === Infinity ? 'never' : d}) and reuses its Frame ${frame}. Page ${page} next used at ${n === Infinity ? 'never' : n}.`
    },
  })
}
