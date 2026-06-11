import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * sections: Array<{
 *   heading: string,
 *   items: Array<{ icon?: string, label?: string, text: string }>
 * }>
 */
export default function SimHelp({ title, sections }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="How to use"
        className="w-7 h-7 rounded-full border border-os-border bg-os-surface text-cyan-400 text-xs font-bold
                   hover:border-cyan-500 hover:bg-cyan-500/10 transition-all flex items-center justify-center shrink-0"
      >
        ?
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setOpen(false)}
            />

            {/* Slide-in panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 h-full w-80 bg-os-surface border-l border-os-border z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between px-5 py-4 border-b border-os-border shrink-0">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">How to use</span>
                  <h3 className="text-white font-semibold text-sm mt-0.5">{title}</h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-500 hover:text-white text-xl leading-none mt-0.5 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                {sections.map((sec, si) => (
                  <div key={si}>
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span>{sec.heading}</span>
                      <div className="flex-1 h-px bg-os-border" />
                    </div>
                    <div className="space-y-2.5">
                      {sec.items.map((item, ii) => (
                        <div key={ii} className="flex gap-2.5">
                          {item.icon && (
                            <span className="shrink-0 text-sm w-5 text-center mt-px">{item.icon}</span>
                          )}
                          <div className="text-xs leading-relaxed">
                            {item.label && (
                              <span className="text-gray-200 font-medium">{item.label}</span>
                            )}
                            {item.label && item.text && (
                              <span className="text-gray-600"> — </span>
                            )}
                            {item.text && (
                              <span className="text-gray-500">{item.text}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-os-border shrink-0">
                <p className="text-[10px] text-gray-600 font-mono">
                  Click ✦ Explain this step for AI explanations at any step.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
