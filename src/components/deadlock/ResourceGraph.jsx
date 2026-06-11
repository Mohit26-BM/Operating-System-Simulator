// Placeholder — a full graph requires SVG/D3 wiring. Shows adjacency list for now.
export default function ResourceGraph({ result, processes, resources }) {
  if (!result) return null

  return (
    <div className="resource-graph">
      <h3>Need Matrix</h3>
      {result.need && (
        <table className="bankers-table">
          <thead>
            <tr>
              <th>P</th>
              {Array.from({ length: resources }, (_, j) => <th key={j}>R{j}</th>)}
            </tr>
          </thead>
          <tbody>
            {result.need.map((row, i) => (
              <tr key={i} className={result.sequence?.includes(`P${i}`) ? 'safe-row' : ''}>
                <td>P{i}</td>
                {row.map((v, j) => <td key={j}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
