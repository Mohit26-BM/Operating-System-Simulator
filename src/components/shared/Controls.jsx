const SPEEDS = [0.5, 1, 1.5, 2]

export default function Controls({
  playing, onPlay, onPause, onForward, onBack, onReset,
  current, max, speed, onSpeedChange,
}) {
  const pct = max > 0 ? (current / max) * 100 : 0

  return (
    <div className="bg-os-surface border border-os-border rounded-xl p-4 space-y-3">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-os-border rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        {/* Playback buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-3 py-1.5 text-sm rounded-lg bg-os-border text-gray-300 hover:bg-[#3d3b4d] transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onBack}
            disabled={current === 0}
            className="px-3 py-1.5 text-sm rounded-lg bg-os-border text-gray-300 hover:bg-[#3d3b4d] disabled:opacity-30 transition-colors"
          >
            ← Back
          </button>
          {playing ? (
            <button
              onClick={onPause}
              className="px-4 py-1.5 text-sm rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors font-medium"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={onPlay}
              disabled={current >= max}
              className="px-4 py-1.5 text-sm rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-30 transition-colors font-medium"
            >
              ▶ Play
            </button>
          )}
          <button
            onClick={onForward}
            disabled={current >= max}
            className="px-3 py-1.5 text-sm rounded-lg bg-os-border text-gray-300 hover:bg-[#3d3b4d] disabled:opacity-30 transition-colors"
          >
            Next →
          </button>
        </div>

        {/* Step counter + speed */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">
            Step {current + 1} / {max + 1}
          </span>
          <div className="flex items-center gap-1">
            {SPEEDS.map(s => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-0.5 text-xs rounded ${
                  speed === s
                    ? 'bg-cyan-600 text-white'
                    : 'bg-os-border text-gray-400 hover:bg-[#3d3b4d]'
                } transition-colors`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

