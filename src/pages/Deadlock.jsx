import { useState } from 'react'
import { motion } from 'framer-motion'
import BankersTable from '../components/deadlock/BankersTable'
import NeedMatrix from '../components/deadlock/NeedMatrix'
import SimHelp from '../components/shared/SimHelp'
import { runBankers } from '../simulation/deadlock/banker'

const HELP = {
  title: "Banker's Algorithm",
  sections: [
    {
      heading: 'What this shows',
      items: [{ text: "Dijkstra's Banker's Algorithm checks whether a resource allocation is in a safe state — meaning processes can finish in some order without deadlock." }],
    },
    {
      heading: 'Step by step',
      items: [
        { icon: '1️⃣', label: 'Set size',       text: 'Choose the number of processes (2–6) and resource types (1–5).' },
        { icon: '2️⃣', label: 'Fill Allocation', text: 'Enter how many of each resource each process currently holds.' },
        { icon: '3️⃣', label: 'Fill Maximum',    text: 'Enter the maximum each process may ever request.' },
        { icon: '4️⃣', label: 'Fill Available',  text: 'Enter the currently available units of each resource type.' },
        { icon: '5️⃣', label: 'Check Safety',    text: 'The algorithm searches for a safe sequence. If found, no deadlock is possible.' },
      ],
    },
    {
      heading: 'Input rules',
      items: [
        { icon: '⚠', label: 'Allocation ≤ Maximum', text: 'Each cell in Allocation must not exceed the same cell in Maximum for the same process and resource.' },
        { icon: '📊', label: 'Need = Max − Allocation', text: 'The Need matrix is computed automatically. It shows how much more each process may request.' },
      ],
    },
    {
      heading: 'Reading the result',
      items: [
        { icon: '🟢', label: 'Safe state',   text: 'A safe sequence exists — processes can finish one by one without getting stuck.' },
        { icon: '🔴', label: 'Unsafe state', text: 'No safe sequence found — deadlock is possible with this allocation.' },
      ],
    },
  ],
}

export default function Deadlock() {
  const [processes, setProcesses] = useState(3)
  const [resources, setResources] = useState(3)
  const [result, setResult] = useState(null)

  function handleCheck(allocation, max, available) {
    setResult(runBankers({ allocation, max, available, processes, resources }))
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Deadlock — Banker's Algorithm</h1>
          <p className="text-gray-400 mt-1 text-sm">
            Fill in allocation and maximum matrices, then check if the system is in a safe state.
          </p>
        </div>
        <SimHelp title={HELP.title} sections={HELP.sections} />
      </div>

      {/* Config */}
      <div className="flex gap-4 items-end">
        {[
          { label: 'Processes', value: processes, set: setProcesses, min: 2, max: 6 },
          { label: 'Resource Types', value: resources, set: setResources, min: 1, max: 5 },
        ].map(({ label, value, set, min, max }) => (
          <label key={label} className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">{label}</span>
            <input
              type="number" min={min} max={max} value={value}
              onChange={e => { set(+e.target.value); setResult(null) }}
              className="w-24 bg-os-surface border border-os-border text-white rounded-lg px-3 py-1.5 text-sm"
            />
          </label>
        ))}
      </div>

      <BankersTable processes={processes} resources={resources} onCheck={handleCheck} />

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-4 border ${
            result.safe
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {result.safe ? (
            <div>
              <p className="font-semibold">Safe State</p>
              <p className="text-sm mt-1 opacity-80">
                Safe sequence: {result.sequence.join(' → ')}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold">Unsafe State — Deadlock Possible</p>
              <p className="text-sm mt-1 opacity-80">
                No safe sequence exists with the current allocation.
              </p>
            </div>
          )}
        </motion.div>
      )}

      {result && <NeedMatrix result={result} processes={processes} resources={resources} />}
    </div>
  )
}
