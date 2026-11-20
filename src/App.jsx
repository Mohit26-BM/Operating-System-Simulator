import { Component, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Navbar from './components/shared/Navbar'
import './App.css'

const Home = lazy(() => import('./pages/Home'))
const Scheduling = lazy(() => import('./pages/Scheduling'))
const Paging = lazy(() => import('./pages/Paging'))
const Deadlock = lazy(() => import('./pages/Deadlock'))
const DiskScheduling = lazy(() => import('./pages/DiskScheduling'))
const ProcessState = lazy(() => import('./pages/ProcessState'))
const ProducerConsumer = lazy(() => import('./pages/ProducerConsumer'))
const DiningPhilosophers = lazy(() => import('./pages/DiningPhilosophers'))
const Synchronization = lazy(() => import('./pages/Synchronization'))
const PageReplacement = lazy(() => import('./pages/PageReplacement'))
const ThreadsVsProcesses = lazy(() => import('./pages/ThreadsVsProcesses'))
const MemoryAllocation = lazy(() => import('./pages/MemoryAllocation'))
const DynamicMemory = lazy(() => import('./pages/DynamicMemory'))

function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24 text-center space-y-4">
      <h1 className="text-3xl font-bold text-white">Page not found</h1>
      <p className="text-gray-400 text-sm">That address does not match any simulator.</p>
      <Link to="/" className="inline-block px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors">Back to the home page</Link>
    </div>
  )
}

// A bug inside one simulator should show a message and a way out, not a blank screen.
class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.error('Simulator crashed:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="max-w-xl mx-auto px-6 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="text-gray-400 text-sm">This simulator hit an unexpected error. Reloading usually fixes it.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => window.location.reload()} className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors">Reload</button>
          <a href="/" className="px-5 py-2 border border-os-border text-gray-300 hover:text-white rounded-lg text-sm transition-colors">Home</a>
        </div>
      </div>
    )
  }
}

function AppLayout() {
  const { pathname } = useLocation()
  return (
    <>
      {pathname !== '/' && <Navbar />}
      {/* keyed by route so an error on one page does not stick when you navigate away */}
      <ErrorBoundary key={pathname}>
        <Suspense fallback={<div className="max-w-xl mx-auto px-6 py-24 text-center text-sm text-gray-500" role="status">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/paging" element={<Paging />} />
          <Route path="/deadlock" element={<Deadlock />} />
          <Route path="/disk" element={<DiskScheduling />} />
          <Route path="/process-state" element={<ProcessState />} />
          <Route path="/producer-consumer" element={<ProducerConsumer />} />
          <Route path="/dining-philosophers" element={<DiningPhilosophers />} />
          <Route path="/synchronization" element={<Synchronization />} />
          <Route path="/page-replacement" element={<PageReplacement />} />
          <Route path="/threads-vs-processes" element={<ThreadsVsProcesses />} />
          <Route path="/memory-allocation" element={<MemoryAllocation />} />
          <Route path="/dynamic-memory" element={<DynamicMemory />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </ErrorBoundary>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-os-bg text-white">
        <AppLayout />
      </div>
    </BrowserRouter>
  )
}
