import { useState, useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { GROUPS, ALL_ITEMS } from '../../navigation'

function DropdownGroup({ group }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()
  const isGroupActive = group.items.some(i => i.path === location.pathname)

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-sm whitespace-nowrap transition-colors px-1 py-0.5 rounded
          ${isGroupActive ? 'text-white font-medium' : 'text-gray-400 hover:text-gray-200'}`}
      >
        {group.label}
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 min-w-45 bg-os-surface border border-os-border rounded-xl shadow-2xl py-1 z-50">
          {group.items.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'text-cyan-400 font-medium bg-cyan-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const current = ALL_ITEMS.find((i) => i.path === pathname)

  return (
    <nav className="bg-os-bg/90 backdrop-blur border-b border-os-border sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <NavLink to="/" className="font-mono text-white font-bold text-lg tracking-tight shrink-0">
            OS<span className="text-cyan-400">Sim</span>
          </NavLink>
          {current && (
            <span className="hidden lg:flex items-center gap-3 min-w-0 text-sm font-mono">
              <span className="text-os-border">/</span>
              <span className="text-gray-300 truncate">{current.label}</span>
            </span>
          )}
        </div>

        {/* Desktop grouped nav */}
        <div className="hidden md:flex items-center gap-6">
          {GROUPS.map(g => (
            <DropdownGroup key={g.label} group={g} />
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Menu"
          aria-expanded={mobileOpen}
          className="md:hidden text-gray-400 hover:text-white p-1"
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu — flat list */}
      {mobileOpen && (
        <div className="md:hidden border-t border-os-border px-6 py-3 space-y-4">
          {GROUPS.map(g => (
            <div key={g.label}>
              <div className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-1.5">{g.label}</div>
              <div className="flex flex-col gap-2">
                {g.items.map(({ label, path }) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `text-sm pl-2 ${isActive ? 'text-white font-medium' : 'text-gray-400'}`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </nav>
  )
}
