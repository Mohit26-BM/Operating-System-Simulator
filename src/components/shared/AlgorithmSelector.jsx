export default function AlgorithmSelector({ options, value, onChange }) {
  return (
    <div className="algo-selector">
      {options.map(opt => (
        <button
          key={opt}
          className={`algo-btn ${value === opt ? 'active' : ''}`}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
