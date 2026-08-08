import { useState, useRef } from 'react'
import Groq from 'groq-sdk'

const client = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
})

export default function AIExplainer({ algorithm, step, stepIndex, totalSteps }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const abortRef = useRef(null)

  async function explain() {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setText('')
    setOpen(true)
    setLoading(true)

    try {
      const stream = await client.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        max_tokens: 150,
        stream: true,
        messages: [
          {
            role: 'system',
            content: 'You are a CS professor explaining OS concepts. Be concise — max 3 sentences. Focus on why this step matters, not just what it does.',
          },
          {
            role: 'user',
            content: `Algorithm: ${algorithm}. Step ${stepIndex + 1} of ${totalSteps}: ${step?.explanation ?? JSON.stringify(step)}. Explain what is happening and why.`,
          },
        ],
      }, { signal: controller.signal })

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        setText(prev => prev + delta)
      }
    } catch (e) {
      if (e.name !== 'AbortError') setText('Could not load explanation. Check your VITE_GROQ_API_KEY.')
    } finally {
      setLoading(false)
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

