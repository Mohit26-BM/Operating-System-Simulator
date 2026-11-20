import { useState } from 'react'
import { motion } from 'framer-motion'
import BankersTable from '../components/deadlock/BankersTable'
import NeedMatrix from '../components/deadlock/NeedMatrix'
import SimHelp from '../components/shared/SimHelp'
import { runBankers, requestResources, MAX_PROCESSES, MAX_RESOURCES } from '../simulation/deadlock/banker'

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
        { icon: '5️⃣', label: 'Check Safety',    text: 'The algorithm searches for a safe sequence and shows how the available vector grows as each process finishes.' },
        { icon: '6️⃣', label: 'Test a request',  text: 'After a safe result, ask whether one process may be granted extra resources right now (the resource-request algorithm).' },
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

const clampInt = (v, min, max) => {
  const n = Math.floor(Number(v))
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min
}

function RequestChecker({ input }) {
  const [pid, setPid] = useState(0)
  const [request, setRequest] = useState(() => new Array(input.resources).fill(0))
  const [answer, setAnswer] = useState(null)

  function check() {
    try {
      setAnswer(requestResources(input, pid, request))
    } catch (e) {
      setAnswer({ granted: false, reason: e.message })
    }
  }

  return (
    <div className="space-y-3 bg-os-surface border border-os-border rounded-xl p-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Test a resource request</h3>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Process</span>
          <select value={pid} onChange={e => { setPid(Number(e.target.value)); setAnswer(null) }}
            className="bg-os-bg border border-os-border text-white rounded-lg px-3 py-1.5 text-sm">
            {Array.from({ length: input.processes }, (_, i) => <option key={i} value={i}>P{i}</option>)}
          </select>
        </label>
        {request.map((v, j) => (
          <label key={j} className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">R{j}</span>
            <input type="number" min={0} max={99} value={v}
              onChange={e => { const next = [...request]; next[j] = clampInt(e.target.value, 0, 99); setRequest(next); setAnswer(null) }}
              className="w-16 bg-os-bg border border-os-border text-white rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-cyan-500" />
          </label>
        ))}
        <button onClick={check} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors">
          Check request
        </button>
      </div>
      {answer && (
        <p role="status" className={`text-sm rounded-lg px-3 py-2 border ${answer.granted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
          {answer.reason}
        </p>
      )}
    </div>
  )
}

export default function Deadlock() {
  const [processes, setProcesses] = useState(3)
  const [resources, setResources] = useState(3)
  const [outcome, setOutcome] = useState(null) // { input, result } | { error }

  function handleCheck(allocation, max, available) {
    const input = { allocation, max, available, processes, resources }
    try {
      setOutcome({ input, result: runBankers(input) })
    } catch (e) {
      setOutcome({ error: e.message })
    }
  }
  const result = outcome?.result ?? null

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
          { label: 'Processes', value: processes, set: setProcesses, min: 2, max: MAX_PROCESSES },
          { label: 'Resource Types', value: resources, set: setResources, min: 1, max: MAX_RESOURCES },
        ].map(({ label, value, set, min, max }) => (
          <label key={label} className="flex flex-col gap-1">
            <span className="text-xs text-gray-500">{label}</span>
            <input
              type="number" min={min} max={max} value={value}
              onChange={e => { set(clampInt(e.target.value, min, max)); setOutcome(null) }}
              className="w-24 bg-os-surface border border-os-border text-white rounded-lg px-3 py-1.5 text-sm"
            />
          </label>
        ))}
      </div>

      <BankersTable key={`${processes}x${resources}`} processes={processes} resources={resources} onCheck={handleCheck} />

      {outcome?.error && <p role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">{outcome.error}</p>}

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

      {result && result.trace.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">How the sequence was found</h3>
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-os-border text-gray-500 text-left">
                  <th className="px-3 py-2 font-normal">#</th><th className="px-3 font-normal">Process</th>
                  <th className="px-3 font-normal">Need</th><th className="px-3 font-normal">Available before</th><th className="px-3 font-normal">Available after finishing</th>
                </tr>
              </thead>
              <tbody>
                {result.trace.map((t, i) => (
                  <tr key={t.process} className="border-b border-os-border/40 text-gray-300">
                    <td className="px-3 py-1.5 text-gray-500">{i + 1}</td>
                    <td className="px-3 text-emerald-300">{t.process}</td>
                    <td className="px-3">[{t.need.join(', ')}] ≤ [{t.workBefore.join(', ')}]</td>
                    <td className="px-3">[{t.workBefore.join(', ')}]</td>
                    <td className="px-3 text-cyan-300">[{t.workAfter.join(', ')}]</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-500">A process can finish when its Need fits inside the available vector. When it finishes it returns everything it holds, so the available vector grows.</p>
        </div>
      )}

      {result && !result.safe && result.stuck.length > 0 && (
        <p className="text-sm text-rose-300">
          Stuck: {result.stuck.map(s => `${s.process} needs [${s.need.join(', ')}]`).join('; ')}. None of these fits in the resources that remain, so they could wait on each other forever.
        </p>
      )}

      {result && <NeedMatrix result={result} resources={resources} />}

      {result && result.safe && <RequestChecker key={JSON.stringify(outcome.input)} input={outcome.input} />}
    </div>
  )
}
