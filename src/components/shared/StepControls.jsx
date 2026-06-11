export default function StepControls({
  playing, onPlay, onPause, onForward, onBack, onReset, current, max
}) {
  return (
    <div className="step-controls">
      <button onClick={onReset}>Reset</button>
      <button onClick={onBack} disabled={current === 0}>Back</button>
      {playing
        ? <button onClick={onPause}>Pause</button>
        : <button onClick={onPlay} disabled={current >= max}>Play</button>
      }
      <button onClick={onForward} disabled={current >= max}>Forward</button>
      <span className="step-counter">Step {current + 1} / {max + 1}</span>
    </div>
  )
}
