import { Link } from 'react-router-dom'
import { GROUPS } from '../../navigation'

// A site-wide footer: what the project is, where everything lives, and credits.
export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-20 border-t border-os-border bg-os-bg/80">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
        <div className="col-span-2 md:col-span-1 space-y-3">
          <Link to="/" className="font-mono font-bold text-lg tracking-tight text-white">
            OS<span className="text-cyan-400">Sim</span>
          </Link>
          <p className="text-sm text-os-muted leading-relaxed max-w-xs">
            Step-by-step simulators for the core ideas of operating systems: scheduling, memory, concurrency and storage.
          </p>
        </div>
        {GROUPS.map((g) => (
          <nav key={g.label} aria-label={g.label} className="space-y-2">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400">{g.label}</p>
            <ul className="space-y-1.5">
              {g.items.map((it) => (
                <li key={it.path}>
                  <Link to={it.path} className="text-sm text-os-muted hover:text-white">{it.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-os-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-os-muted">
          <p>© {year} OS Simulator. For learning: simplified models of real operating systems.</p>
          <p>
            Photos from <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Pexels</a>
            {' · '}Built with React and Tailwind
          </p>
        </div>
      </div>
    </footer>
  )
}
