import { fifo, FIFO_CODE, FIFO_ANNOTATIONS } from './fifo'
import { lru, LRU_CODE, LRU_ANNOTATIONS } from './lru'
import { optimal, OPTIMAL_CODE, OPTIMAL_ANNOTATIONS } from './optimal'
export { validatePagingInput, parseReferenceString } from './common'

export function simulatePaging({ frames, referenceString, algorithm }) {
  switch (algorithm) {
    case 'FIFO':    return fifo(referenceString, frames)
    case 'LRU':     return lru(referenceString, frames)
    case 'Optimal': return optimal(referenceString, frames)
    default:        return fifo(referenceString, frames)
  }
}

export function getPagingCode(algorithm) {
  switch (algorithm) {
    case 'FIFO':    return FIFO_CODE
    case 'LRU':     return LRU_CODE
    case 'Optimal': return OPTIMAL_CODE
    default:        return FIFO_CODE
  }
}

export function getPagingAnnotations(algorithm) {
  switch (algorithm) {
    case 'FIFO':    return FIFO_ANNOTATIONS
    case 'LRU':     return LRU_ANNOTATIONS
    case 'Optimal': return OPTIMAL_ANNOTATIONS
    default:        return FIFO_ANNOTATIONS
  }
}
