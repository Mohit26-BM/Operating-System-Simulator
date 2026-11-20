import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import './index.css'
import App from './App.jsx'

// Sliders show how far they are filled. A tiny listener keeps that in sync after any change,
// including changes made by preset buttons rather than by dragging.
function syncRanges() {
  document.querySelectorAll('input[type="range"]').forEach((r) => {
    const min = Number(r.min) || 0
    const max = Number(r.max) || 100
    r.style.setProperty('--fill', `${((Number(r.value) - min) / (max - min || 1)) * 100}%`)
  })
}
let rangeFrame = 0
const scheduleRangeSync = () => {
  cancelAnimationFrame(rangeFrame)
  rangeFrame = requestAnimationFrame(syncRanges)
}
for (const type of ['input', 'change', 'click', 'keyup', 'pointerup']) document.addEventListener(type, scheduleRangeSync, true)
new MutationObserver(scheduleRangeSync).observe(document.body, { childList: true, subtree: true })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
