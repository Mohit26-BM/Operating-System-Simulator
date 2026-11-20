import { useState } from 'react'
import { parseIoSpec } from '../../simulation/parse'
import { validateProcesses } from '../../simulation/scheduling/common'

const defaults = { arrival: 0, burst: 1, priority: 1 }
const MAX_VALUE = 99
const MAX_PROCESSES = 8

export default function ProcessForm({ onAdd, onClear, processCount = 0 }) {
  const [form, setForm] = useState(defaults)
  const [errors, setErrors] = useState({})
  const [count, setCount] = useState(0)
  const [ioText, setIoText] = useState('')

  function validate() {
    const e = {}
    const whole = (v) => Number.isInteger(v)
    if (!whole(form.arrival) || form.arrival < 0 || form.arrival > MAX_VALUE) e.arrival = `Whole number 0–${MAX_VALUE}`
    if (!whole(form.burst) || form.burst < 1 || form.burst > MAX_VALUE) e.burst = `Whole number 1–${MAX_VALUE}`
    if (!whole(form.priority) || form.priority < 1 || form.priority > MAX_VALUE) e.priority = `Whole number 1–${MAX_VALUE}`
    if (processCount >= MAX_PROCESSES) e.global = `Maximum ${MAX_PROCESSES} processes`
    const io = parseIoSpec(ioText)
    if (!io.ok) e.io = io.error
    else if (io.io.length && !e.burst) {
      try { validateProcesses([{ id: 'P', arrival: 0, burst: form.burst, priority: 1, io: io.io }]) } catch (err) { e.io = err.message.replace(/^P: /, '') }
    }
    return e
  }

  function handleAdd() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    const io = parseIoSpec(ioText).io
    onAdd({ id: `P${count}`, ...form, ...(io.length ? { io } : {}) })
    setCount(c => c + 1)
    setForm(defaults)
    setIoText('')
    setErrors({})
  }

  function handleClear() {
    onClear()
    setCount(0)
    setIoText('')
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

        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">I/O (optional)</span>
          <input
            value={ioText} placeholder="2:3 5:1"
            onChange={e => { setIoText(e.target.value); setErrors(er => { const n = { ...er }; delete n.io; return n }) }}
            title="After this many CPU units the process does I/O for this many units. Example: 2:3 means 'after 2 units of CPU, do 3 units of I/O'."
            className={`w-28 bg-os-bg border text-white rounded-lg px-2 py-1.5 text-sm font-mono transition-colors focus:outline-none
              ${errors.io ? 'border-red-500' : 'border-os-border focus:border-cyan-500'}`}
          />
          {errors.io && <span className="text-[10px] text-red-400 max-w-[220px]">{errors.io}</span>}
        </label>

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
