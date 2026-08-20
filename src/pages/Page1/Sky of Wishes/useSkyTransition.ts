'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'


/* ============================================================
   TYPES
============================================================ */

export interface SkyTransitionState {
  progress: number

  isTransitioning: boolean

  isRoomVisible: boolean

  isSkyVisible: boolean

  isCelebrationVisible: boolean

  isComplete: boolean
}

interface UseSkyTransitionOptions {
  duration?: number

  autoStart?: boolean

  onRoomExit?: () => void

  onSkyReveal?: () => void

  onCelebrationStart?: () => void

  onComplete?: () => void
}


/* ============================================================
   EASING
============================================================ */

function easeInOutCubic(
  value: number,
) {
  return value < 0.5
    ? 4 *
        value *
        value *
        value
    : 1 -
        Math.pow(
          -2 * value + 2,
          3,
        ) /
          2
}


/* ============================================================
   CLAMP
============================================================ */

function clamp(
  value: number,
  min = 0,
  max = 1,
) {
  return Math.max(
    min,
    Math.min(max, value),
  )
}


/* ============================================================
   HOOK
============================================================ */

export function useSkyTransition({
  duration = 6500,

  autoStart = false,

  onRoomExit,

  onSkyReveal,

  onCelebrationStart,

  onComplete,
}: UseSkyTransitionOptions = {}) {
  const [state, setState] =
    useState<SkyTransitionState>({
      progress: 0,

      isTransitioning: false,

      isRoomVisible: true,

      isSkyVisible: false,

      isCelebrationVisible: false,

      isComplete: false,
    })


  const animationFrame =
    useRef<number | null>(null)

  const startTime =
    useRef<number | null>(null)

  const startedRef =
    useRef(false)

  const roomExitCalled =
    useRef(false)

  const skyRevealCalled =
    useRef(false)

  const celebrationCalled =
    useRef(false)

  const completeCalled =
    useRef(false)


  /* ==========================================================
     CLEANUP
  ========================================================== */

  const stopAnimation =
    useCallback(() => {
      if (
        animationFrame.current !==
        null
      ) {
        cancelAnimationFrame(
          animationFrame.current,
        )

        animationFrame.current =
          null
      }
    }, [])


  /* ==========================================================
     RESET
  ========================================================== */

  const reset = useCallback(() => {
    stopAnimation()

    startTime.current = null

    startedRef.current = false

    roomExitCalled.current = false

    skyRevealCalled.current = false

    celebrationCalled.current = false

    completeCalled.current = false

    setState({
      progress: 0,

      isTransitioning: false,

      isRoomVisible: true,

      isSkyVisible: false,

      isCelebrationVisible: false,

      isComplete: false,
    })
  }, [stopAnimation])


  /* ==========================================================
     START TRANSITION
  ========================================================== */

  const start = useCallback(() => {
    /*
     * Prevent duplicate transitions.
     */
    if (
      startedRef.current
    ) {
      return
    }

    startedRef.current = true

    stopAnimation()

    startTime.current =
      performance.now()

    setState((previous) => ({
      ...previous,

      isTransitioning: true,

      isComplete: false,
    }))


    /* ========================================================
       ANIMATION LOOP
    ======================================================== */

    const animate = (
      currentTime: number,
    ) => {
      if (
        startTime.current === null
      ) {
        startTime.current =
          currentTime
      }

      const elapsed =
        currentTime -
        startTime.current

      const rawProgress =
        clamp(
          elapsed / duration,
        )

      const progress =
        easeInOutCubic(
          rawProgress,
        )


      /* ======================================================
         PHASES

         0.00 → 0.20
         Room still visible

         0.20 → 0.48
         Camera/room transition

         0.48 → 0.70
         Sky reveals

         0.70 → 0.82
         Particles rise

         0.82 → 1.00
         Celebration
      ====================================================== */


      /* ======================================================
         ROOM EXIT
      ====================================================== */

      if (
        progress >= 0.2 &&
        !roomExitCalled.current
      ) {
        roomExitCalled.current =
          true

        onRoomExit?.()
      }


      /* ======================================================
         SKY REVEAL
      ====================================================== */

      if (
        progress >= 0.48 &&
        !skyRevealCalled.current
      ) {
        skyRevealCalled.current =
          true

        onSkyReveal?.()
      }


      /* ======================================================
         CELEBRATION START
      ====================================================== */

      if (
        progress >= 0.75 &&
        !celebrationCalled.current
      ) {
        celebrationCalled.current =
          true

        onCelebrationStart?.()
      }


      /* ======================================================
         VISUAL STATE
      ====================================================== */

      const roomVisible =
        progress < 0.72

      const skyVisible =
        progress >= 0.38

      const celebrationVisible =
        progress >= 0.72


      setState({
        progress,

        isTransitioning:
          rawProgress < 1,

        isRoomVisible:
          roomVisible,

        isSkyVisible:
          skyVisible,

        isCelebrationVisible:
          celebrationVisible,

        isComplete:
          rawProgress >= 1,
      })


      /* ======================================================
         COMPLETE
      ====================================================== */

      if (
        rawProgress >= 1
      ) {
        animationFrame.current =
          null

        if (
          !completeCalled.current
        ) {
          completeCalled.current =
            true

          onComplete?.()
        }

        return
      }


      animationFrame.current =
        requestAnimationFrame(
          animate,
        )
    }


    animationFrame.current =
      requestAnimationFrame(
        animate,
      )
  }, [
    duration,
    onRoomExit,
    onSkyReveal,
    onCelebrationStart,
    onComplete,
    stopAnimation,
  ])


  /* ==========================================================
     AUTO START
  ========================================================== */

  useEffect(() => {
    if (!autoStart) {
      return
    }

    start()

    return () => {
      stopAnimation()
    }
  }, [
    autoStart,
    start,
    stopAnimation,
  ])


  /* ==========================================================
     CLEANUP ON UNMOUNT
  ========================================================== */

  useEffect(() => {
    return () => {
      stopAnimation()
    }
  }, [stopAnimation])


  /* ==========================================================
     MANUAL PROGRESS
     
     Useful if later you want:
     
     - Scroll controlled transition
     - Button controlled transition
     - Audio controlled transition
     - Timeline controlled transition
  ========================================================== */

  const setProgress =
    useCallback(
      (value: number) => {
        const progress =
          clamp(value)

        setState({
          progress,

          isTransitioning:
            progress > 0 &&
            progress < 1,

          isRoomVisible:
            progress < 0.72,

          isSkyVisible:
            progress >= 0.38,

          isCelebrationVisible:
            progress >= 0.72,

          isComplete:
            progress >= 1,
        })
      },
      [],
    )


  /* ==========================================================
     RETURN
  ========================================================== */

  return {
    ...state,

    start,

    reset,

    stop: stopAnimation,

    setProgress,
  }
}


export default useSkyTransition
