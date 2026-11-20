import { useState, useEffect, useCallback } from 'react'

// Playback state for a list of precomputed simulation steps.
// The timer lives in one effect that is cleaned up whenever playback stops, the speed changes or
// the page is left, so timers can never pile up or keep running after navigation.
export function usePlayer() {
  const [steps, setSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [wantsPlay, setWantsPlay] = useState(false)
  const [speed, setSpeed] = useState(1)

  const lastIndex = steps.length - 1
  // Playback ends by itself on the last step
  const playing = wantsPlay && currentStep < lastIndex

  useEffect(() => {
    if (!playing) return undefined
    const id = setInterval(() => setCurrentStep((prev) => Math.min(prev + 1, lastIndex)), 1000 / speed)
    return () => clearInterval(id)
  }, [playing, speed, lastIndex])

  const play = useCallback(() => {
    if (steps.length === 0) return
    setCurrentStep((prev) => (prev >= steps.length - 1 ? 0 : prev))
    setWantsPlay(true)
  }, [steps.length])

  const pause = useCallback(() => setWantsPlay(false), [])

  const stepForward = useCallback(() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1)), [steps.length])

  const stepBack = useCallback(() => setCurrentStep((prev) => Math.max(prev - 1, 0)), [])

  const reset = useCallback((newSteps = []) => {
    setWantsPlay(false)
    setSteps(newSteps)
    setCurrentStep(0)
  }, [])

  const changeSpeed = useCallback((s) => setSpeed(s), [])

  return { steps, currentStep, playing, speed, play, pause, stepForward, stepBack, reset, changeSpeed }
}
