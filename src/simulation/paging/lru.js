import { runReplacement } from './common'

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
  return runReplacement(referenceString, frameCount, {
    onHit(state, page) {
      state.recent.splice(state.recent.indexOf(page), 1)
      state.recent.push(page)
    },
    onLoad(state, page, evicted) {
      if (evicted !== null) state.recent.splice(state.recent.indexOf(evicted), 1)
      state.recent.push(page)
    },
    victim: (state) => state.recent[0],
    lines: { hit: 2, faultEvict: 8, faultFree: 6 },
    hitText: (page, frame, tlbHit) =>
      `Page ${page} hit in Frame ${frame}. Marked most-recently-used. ${tlbHit ? 'TLB hit.' : 'TLB updated.'}`,
    faultText: (page, frame, evicted) => evicted !== null
      ? `Page fault! Evicted Page ${evicted} (least recently used). Loaded Page ${page} into its Frame ${frame} as most recent.`
      : `Page fault! Free frame available. Loaded Page ${page} into Frame ${frame}.`,
  })
}
