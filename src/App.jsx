import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Scheduling from './pages/Scheduling'
import Paging from './pages/Paging'
import Deadlock from './pages/Deadlock'
import DiskScheduling from './pages/DiskScheduling'
import ProcessState from './pages/ProcessState'
import ProducerConsumer from './pages/ProducerConsumer'
import DiningPhilosophers from './pages/DiningPhilosophers'
import Synchronization from './pages/Synchronization'
import PageReplacement from './pages/PageReplacement'
import ThreadsVsProcesses from './pages/ThreadsVsProcesses'
import MemoryAllocation from './pages/MemoryAllocation'
import Navbar from './components/shared/Navbar'
import './App.css'

function AppLayout() {
  const { pathname } = useLocation()
  return (
    <>
      {pathname !== '/' && <Navbar />}
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
      </Routes>
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
