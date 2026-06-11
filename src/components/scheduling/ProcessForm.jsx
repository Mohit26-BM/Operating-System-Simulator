import { useState } from 'react'

const defaults = { arrival: 0, burst: 1, priority: 1 }
const MAX_PROCESSES = 8

export default function ProcessForm({ onAdd, onClear, processCount = 0 }) {
  const [form, setForm] = useState(defaults)
  const [errors, setErrors] = useState({})
  const [count, setCount] = useState(0)

  function validate() {
    const e = {}
    if (form.arrival < 0)       e.arrival  = 'Must be ≥ 0'
    if (form.burst < 1)         e.burst    = 'Must be ≥ 1'
    if (form.priority < 1)      e.priority = 'Must be ≥ 1'
    if (processCount >= MAX_PROCESSES) e.global = `Maximum ${MAX_PROCESSES} processes`
    return e
  }

  function handleAdd() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onAdd({ id: `P${count}`, ...form })
    setCount(c => c + 1)
    setForm(defaults)
    setErrors({})
  }

  function handleClear() {
    onClear()
    setCount(0)
    setErrors({})
  }

  function set(key, raw) {
    const val = raw === '' ? '' : +raw
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => { const next = { ...e }; delete next[key]; delete next.global; return next })
  }

  const fields = [
    { label: 'Arrival', key: 'arrival', min: 0, hint: '≥ 0' },
    { label: 'Burst',   key: 'burst',   min: 1, hint: '≥ 1' },
    { label: 'Priority',key: 'priority',min: 1, hint: '≥ 1 (lower = higher priority)' },
  ]

  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Add Process</h3>
        <span className="text-xs text-gray-600 font-mono">{processCount} / {MAX_PROCESSES}</span>
      </div>

      {errors.global && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {errors.global}
        </p>
      )}

      <div className="flex items-end gap-3 flex-wrap">
        {fields.map(({ label, key, min, hint }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">{label}</span>
            <input
              type="number" min={min}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              className={`w-20 bg-os-bg border text-white rounded-lg px-2 py-1.5 text-sm transition-colors
                ${errors[key] ? 'border-red-500 focus:border-red-400' : 'border-os-border focus:border-cyan-500'}
                focus:outline-none`}
              title={hint}
            />
            {errors[key] && (
              <span className="text-[10px] text-red-400">{errors[key]}</span>
            )}
          </label>
        ))}

        <button
          onClick={handleAdd}
          disabled={processCount >= MAX_PROCESSES}
          className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-1.5 bg-os-border hover:bg-[#2a3a4a] text-gray-300 rounded-lg text-sm transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
