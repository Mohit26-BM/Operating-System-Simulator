import { motion } from 'framer-motion'

export default function CodePanel({ code, highlightLine, annotations = {} }) {
  return (
    <div className="bg-os-bg border border-os-border rounded-xl overflow-hidden font-mono text-sm">
      <div className="px-4 py-2 bg-os-surface border-b border-os-border text-xs text-gray-500 tracking-widest uppercase">
        Pseudocode
      </div>
      <div className="p-4 space-y-0.5">
        {code.map((line, i) => {
          const isActive = i === highlightLine
          return (
            <motion.div
              key={i}
              animate={isActive ? { backgroundColor: 'rgba(143,160,255,0.15)' } : { backgroundColor: 'transparent' }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 px-2 py-0.5 rounded ${isActive ? 'border-l-2 border-cyan-500' : 'border-l-2 border-transparent'}`}
            >
              <span className="text-gray-600 select-none w-5 text-right shrink-0">{i + 1}</span>
              <span
                className={isActive ? 'text-cyan-300' : 'text-gray-400'}
                style={{ paddingLeft: `${(line.match(/^\s*/)[0].length / 2) * 12}px` }}
              >
                {line.trimStart()}
              </span>
              {isActive && annotations[i] && (
                <span className="ml-auto text-xs text-cyan-400 italic shrink-0">
                  ← {annotations[i]}
                </span>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

