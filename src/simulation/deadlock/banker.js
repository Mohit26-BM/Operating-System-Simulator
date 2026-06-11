// Banker's Algorithm — returns { safe, sequence } or { safe: false }
export function runBankers({ allocation, max, available, processes, resources }) {
  const need = Array.from({ length: processes }, (_, i) =>
    Array.from({ length: resources }, (_, j) => max[i][j] - allocation[i][j])
  )

  const work = [...available]
  const finish = new Array(processes).fill(false)
  const sequence = []

  let found = true
  while (found) {
    found = false
    for (let i = 0; i < processes; i++) {
      if (!finish[i] && need[i].every((n, j) => n <= work[j])) {
        for (let j = 0; j < resources; j++) work[j] += allocation[i][j]
        finish[i] = true
        sequence.push(`P${i}`)
        found = true
      }
    }
  }

  return finish.every(Boolean)
    ? { safe: true, sequence, need }
    : { safe: false, sequence, need }
}
