export default function PageTable({ step }) {
  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-2">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Page Table</h3>
      {!step ? (
        <p className="text-sm text-gray-500">Run simulation to see page table.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-os-border">
              <th className="pb-1 text-left">Page</th>
              <th className="pb-1 text-left">Frame</th>
              <th className="pb-1 text-left">Valid</th>
            </tr>
          </thead>
          <tbody>
            {step.pageTable.map(({ page, frame, valid }) => (
              <tr
                key={page}
                className={`border-b border-os-border/40 ${step.page === page ? 'bg-amber-500/10' : ''}`}
              >
                <td className="py-1 font-mono text-gray-300">{page}</td>
                <td className="py-1 font-mono text-gray-300">{frame}</td>
                <td className={`py-1 font-bold ${valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {valid ? '1' : '0'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
