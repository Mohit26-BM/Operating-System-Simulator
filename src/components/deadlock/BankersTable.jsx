import { useState, useEffect } from 'react'

function makeMatrix(r, c) {
  return Array.from({ length: r }, () => new Array(c).fill(0))
}

function MatrixInput({ title, rows, cols, matrix, onChange, errorCells = new Set() }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h3>
      <div className="bg-os-bg border border-os-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-os-border">
              <th className="px-3 py-2 text-left text-xs text-gray-500">P</th>
              {Array.from({ length: cols }, (_, j) => (
                <th key={j} className="px-3 py-2 text-left text-xs text-gray-500">R{j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i} className="border-b border-os-border/40">
                <td className="px-3 py-2 font-mono text-gray-400 text-xs">P{i}</td>
                {Array.from({ length: cols }, (_, j) => {
                  const cellKey = `${i}-${j}`
                  const hasError = errorCells.has(cellKey)
                  return (
                    <td key={j} className="px-2 py-1.5">
                      <input
                        type="number" min={0} value={matrix[i]?.[j] ?? 0}
                        onChange={e => onChange(i, j, +e.target.value)}
                        className={`w-14 border text-white rounded-lg px-2 py-1 text-sm text-center focus:outline-none transition-colors
                          ${hasError
                            ? 'bg-red-500/10 border-red-500 focus:border-red-400'
                            : 'bg-os-surface border-os-border focus:border-cyan-500'}`}
                        title={hasError ? 'Allocation exceeds Maximum for this resource' : undefined}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function BankersTable({ processes, resources, onCheck }) {
  const [allocation, setAllocation] = useState(() => makeMatrix(processes, resources))
  const [max, setMax] = useState(() => makeMatrix(processes, resources))
  const [available, setAvailable] = useState(() => new Array(resources).fill(0))
  const [errors, setErrors] = useState({ alloc: new Set(), available: [] })

  useEffect(() => {
    setAllocation(makeMatrix(processes, resources))
    setMax(makeMatrix(processes, resources))
    setAvailable(new Array(resources).fill(0))
    setErrors({ alloc: new Set(), available: [] })
  }, [processes, resources])

  function updateMatrix(setter, matrix, r, c, val) {
    const next = matrix.map(row => [...row])
    next[r][c] = Math.max(0, val)
    setter(next)
    setErrors(e => ({ ...e, alloc: new Set() }))
  }

  function validate() {
    const allocErrors = new Set()
    const availErrors = []

    // allocation[i][j] must not exceed max[i][j]
    for (let i = 0; i < processes; i++) {
      for (let j = 0; j < resources; j++) {
        if ((allocation[i]?.[j] ?? 0) > (max[i]?.[j] ?? 0)) {
          allocErrors.add(`${i}-${j}`)
        }
      }
    }

    // available must be >= 0
    available.forEach((v, j) => {
      if (v < 0) availErrors.push(j)
    })

    setErrors({ alloc: allocErrors, available: availErrors })
    return allocErrors.size === 0 && availErrors.length === 0
  }

  function handleCheck() {
    if (validate()) {
      onCheck(allocation, max, available)
    }
  }

  return (
    <div className="space-y-6">
      {errors.alloc.size > 0 && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          Allocation cannot exceed Maximum for the same process and resource (highlighted in red).
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MatrixInput
          title="Allocation"
          rows={processes} cols={resources}
          matrix={allocation}
          errorCells={errors.alloc}
          onChange={(r, c, v) => updateMatrix(setAllocation, allocation, r, c, v)}
        />
        <MatrixInput
          title="Maximum"
          rows={processes} cols={resources}
          matrix={max}
          errorCells={new Set()}
          onChange={(r, c, v) => updateMatrix(setMax, max, r, c, v)}
        />
      </div>

      {/* Available */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Available Resources</h3>
        <div className="flex gap-3 flex-wrap">
          {available.map((v, j) => (
            <label key={j} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">R{j}</span>
              <input
                type="number" min={0} value={v}
                onChange={e => {
                  const next = [...available]
                  next[j] = Math.max(0, +e.target.value)
                  setAvailable(next)
                  setErrors(err => ({ ...err, available: err.available.filter(x => x !== j) }))
                }}
                className={`w-20 border text-white rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none transition-colors
                  ${errors.available.includes(j)
                    ? 'bg-red-500/10 border-red-500'
                    : 'bg-os-surface border-os-border focus:border-cyan-500'}`}
              />
              {errors.available.includes(j) && (
                <span className="text-[10px] text-red-400">Must be ≥ 0</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={handleCheck}
        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Check Safety
      </button>
    </div>
  )
}
