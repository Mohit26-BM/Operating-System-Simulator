// One list of every simulator, used by the navigation bar and the footer.
export const GROUPS = [
  {
    label: 'CPU & Process',
    items: [
      { label: 'CPU Scheduling', path: '/scheduling' },
      { label: 'Process States', path: '/process-state' },
      { label: 'Threads vs Processes', path: '/threads-vs-processes' },
    ],
  },
  {
    label: 'Concurrency',
    items: [
      { label: 'Synchronization', path: '/synchronization' },
      { label: 'Producer-Consumer', path: '/producer-consumer' },
      { label: 'Dining Philosophers', path: '/dining-philosophers' },
      { label: 'Deadlock', path: '/deadlock' },
    ],
  },
  {
    label: 'Memory',
    items: [
      { label: 'Memory & Paging', path: '/paging' },
      { label: 'Page Replacement', path: '/page-replacement' },
      { label: 'Memory Allocation', path: '/memory-allocation' },
      { label: 'Dynamic Allocation', path: '/dynamic-memory' },
      { label: 'Disk Scheduling', path: '/disk' },
    ],
  },
]

export const ALL_ITEMS = GROUPS.flatMap((g) => g.items)
