import { useState, useRef, useCallback } from 'react'

export function useSimulation() {
  const [steps, setSteps] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef(null)

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    setPlaying(false)
  }, [])

  const play = useCallback(() => {
    setPlaying(true)
    intervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          stop()
          return prev
        }
        return prev + 1
      })
    }, 700)
  }, [steps.length, stop])

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

  return { steps, currentStep, playing, play, pause, stepForward, stepBack, reset }
}
