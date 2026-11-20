import { runReplacement } from './common'

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
  return runReplacement(referenceString, frameCount, {
    onHit() {},
    onLoad(state, page, evicted) {
      if (evicted !== null) state.order.splice(state.order.indexOf(evicted), 1)
      state.order.push(page)
    },
    victim: (state) => state.order[0],
    lines: { hit: 2, faultEvict: 7, faultFree: 5 },
    hitText: (page, frame, tlbHit) =>
      `Page ${page} is already in Frame ${frame}. ${tlbHit ? 'TLB hit — found instantly.' : 'Page table hit — TLB updated.'}`,
    faultText: (page, frame, evicted) => evicted !== null
      ? `Page fault! Page ${page} not in memory. Evicted Page ${evicted} (oldest) and loaded Page ${page} into its Frame ${frame}.`
      : `Page fault! Page ${page} not in memory. Loaded into free Frame ${frame}.`,
  })
}
