// Input validation and rate limiting for the AI explanation endpoint.
// The leading underscore keeps this file from being deployed as its own route.

export const LIMITS = { topic: 80, explanation: 1200, steps: 10000 }

function cleanText(v, max) {
  if (typeof v !== 'string') return null
  // replace control characters (keep newline) so they cannot disturb the prompt layout
  // eslint-disable-next-line no-control-regex
  const t = v.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ').trim()
  if (t.length === 0 || t.length > max) return null
  return t
}

export function parseExplainRequest(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, error: 'Body must be a JSON object' }
  }
  const algorithm = cleanText(body.algorithm, LIMITS.topic)
  if (!algorithm) return { ok: false, error: 'algorithm is required (max 80 characters)' }
  const stepExplanation = cleanText(body.stepExplanation, LIMITS.explanation)
  if (!stepExplanation) return { ok: false, error: 'stepExplanation is required (max 1200 characters)' }
  const { stepIndex, totalSteps } = body
  if (!Number.isInteger(stepIndex) || !Number.isInteger(totalSteps)) {
    return { ok: false, error: 'stepIndex and totalSteps must be integers' }
  }
  if (totalSteps < 1 || totalSteps > LIMITS.steps || stepIndex < 0 || stepIndex >= totalSteps) {
    return { ok: false, error: 'stepIndex must be within 0..totalSteps-1' }
  }
  return { ok: true, value: { algorithm, stepExplanation, stepIndex, totalSteps } }
}

/** Fixed-window counter per key; old windows are swept so memory stays bounded. */
export class RateLimiter {
  constructor(max, windowMs, maxKeys = 5000) {
    this.max = max
    this.windowMs = windowMs
    this.maxKeys = maxKeys
    this.hits = new Map()
  }

  /** Returns 0 when allowed, otherwise the number of seconds to wait. */
  check(key, now = Date.now()) {
    if (this.hits.size >= this.maxKeys) {
      for (const [k, v] of this.hits) if (now - v.start >= this.windowMs) this.hits.delete(k)
      if (this.hits.size >= this.maxKeys) this.hits.clear()
    }
    const cur = this.hits.get(key)
    if (!cur || now - cur.start >= this.windowMs) {
      this.hits.set(key, { start: now, count: 1 })
      return 0
    }
    if (cur.count >= this.max) return Math.max(1, Math.ceil((cur.start + this.windowMs - now) / 1000))
    cur.count += 1
    return 0
  }
}

/** Visitor address from X-Forwarded-For, trusting only `hops` proxies (0 = ignore the header). */
export function clientKey(forwardedFor, hops) {
  if (hops <= 0 || !forwardedFor) return 'direct'
  const parts = String(forwardedFor).split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return 'direct'
  return parts[Math.max(0, parts.length - hops)].slice(0, 64)
}
