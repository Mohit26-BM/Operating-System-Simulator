import { useEffect, useRef, useState } from 'react'

// Asks the server (/api/explain) for a short explanation of the current step. The browser never
// holds an API key: the key lives on the server side of that endpoint.

function stepText(step) {
  const text = typeof step?.explanation === 'string' ? step.explanation : JSON.stringify(step ?? {})
  return text.slice(0, 1000)
}

export default function AIExplainer({ algorithm, step, stepIndex, totalSteps }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const abortRef = useRef(null)

  // Stop any in-flight request when the component goes away
  useEffect(() => () => abortRef.current?.abort(), [])

  async function explain() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setText('')
    setOpen(true)
    setLoading(true)

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithm: String(algorithm ?? '').slice(0, 80),
          stepExplanation: stepText(step),
          stepIndex: Math.max(0, stepIndex ?? 0),
          totalSteps: Math.max(1, totalSteps ?? 1),
        }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        setText(
          res.status === 429 ? 'Too many requests. Please wait a minute and try again.'
            : res.status === 503 ? 'The AI explanation is not configured on this server.'
            : 'The explanation is unavailable right now. Try again in a moment.',
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      setLoading(false)
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        setText((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch (e) {
      if (e.name !== 'AbortError') setText('Something went wrong. Try again.')
    } finally {
      if (abortRef.current === controller) setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={explain}
        className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
      >
        <span className="text-base">✦</span>
        Explain this step
      </button>

      {open && (
        <div className="mt-2 p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-lg text-sm text-cyan-100 leading-relaxed min-h-[48px]">
          {loading && !text && (
            <span className="text-cyan-400 animate-pulse">Thinking...</span>
          )}
          {text}
          {loading && text && <span className="animate-pulse">▍</span>}
        </div>
      )}
    </div>
  )
}
