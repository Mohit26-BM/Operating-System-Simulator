import { useState, useRef, useCallback } from 'react'

export function usePlayer() {
  const [steps, setSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const intervalRef = useRef(null)

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setPlaying(false)
  }, [])

  const play = useCallback(() => {
    if (currentStep >= steps.length - 1) setCurrentStep(0)
    setPlaying(true)
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) { stop(); return prev }
        return prev + 1
      })
    }, 1000 / speed)
  }, [steps.length, speed, stop, currentStep])

  const pause = useCallback(() => stop(), [stop])

  const stepForward = useCallback(() =>
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1)), [steps.length])

  const stepBack = useCallback(() =>
    setCurrentStep(prev => Math.max(prev - 1, 0)), [])

  const reset = useCallback((newSteps = []) => {
    stop()
    setSteps(newSteps)
    setCurrentStep(0)
  }, [stop])

  const changeSpeed = useCallback((s) => {
    setSpeed(s)
    if (playing) { stop(); }
  }, [playing, stop])

  return {
    steps, currentStep, playing, speed,
    play, pause, stepForward, stepBack, reset, changeSpeed,
  }
}
