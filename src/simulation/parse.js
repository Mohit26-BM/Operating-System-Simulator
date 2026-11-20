// Strict number parsing for the input fields. parseInt/Number are too forgiving: "53abc" parses
// as 53 and an empty string as 0, which would silently run the wrong simulation.

/** "12" -> { ok: true, value: 12 }; anything else (decimals, letters, empty, out of range) -> { ok: false, error }. */
export function parseInteger(text, { min = 0, max = Number.MAX_SAFE_INTEGER, label = 'Value' } = {}) {
  const t = String(text ?? '').trim()
  if (!/^-?\d+$/.test(t)) return { ok: false, error: `${label} must be a whole number` }
  const value = Number(t)
  if (!Number.isSafeInteger(value) || value < min || value > max) return { ok: false, error: `${label} must be between ${min} and ${max}` }
  return { ok: true, value }
}

/** "1 2, 3" -> { ok: true, values: [1, 2, 3] }. Separators are spaces or commas. */
export function parseIntegerList(text, { min = 0, max = Number.MAX_SAFE_INTEGER, minCount = 1, maxCount = 1000, label = 'Values' } = {}) {
  const tokens = String(text ?? '').trim().split(/[\s,]+/).filter(Boolean)
  if (tokens.length < minCount) return { ok: false, error: `${label}: enter at least ${minCount} number${minCount === 1 ? '' : 's'}` }
  if (tokens.length > maxCount) return { ok: false, error: `${label}: at most ${maxCount} numbers` }
  const values = []
  for (const tok of tokens) {
    const r = parseInteger(tok, { min, max, label: `"${tok}"` })
    if (!r.ok) return { ok: false, error: `${label}: ${r.error}` }
    values.push(r.value)
  }
  return { ok: true, values }
}

/** "2:3 4:1" -> [{ at: 2, duration: 3 }, { at: 4, duration: 1 }]. Empty text means no I/O. */
export function parseIoSpec(text) {
  const t = String(text ?? '').trim()
  if (t === '') return { ok: true, io: [] }
  const io = []
  for (const tok of t.split(/[\s,]+/).filter(Boolean)) {
    const m = /^(\d+):(\d+)$/.exec(tok)
    if (!m) return { ok: false, error: `"${tok}" is not in the form AFTER:DURATION (for example 2:3)` }
    io.push({ at: Number(m[1]), duration: Number(m[2]) })
  }
  return { ok: true, io }
}
