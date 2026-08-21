'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  AnimatePresence,
  motion,
} from 'framer-motion'

import { useAppContext } from '../../context/AppContext'
import { BIRTHDAY_TARGET } from '../../config'

import { CountdownPhase } from './CountdownPhase'
import { FireworksPhase } from './FireworksPhase'
import CakeAssembly from './CakeAssembly'
import WishMoment from './WishMoment'

import type { Page1State } from './types'

import styles from './Page1.module.css'


export interface Page1Props {
  onComplete: () => void
}


export function Page1({
  onComplete,
}: Page1Props) {
  const { userData } =
    useAppContext()

  const [phase, setPhase] =
    useState<Page1State>(
      'countdown',
    )

  const [assembled, setAssembled] =
    useState(false)

  const blowOutTimeoutRef =
    useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (blowOutTimeoutRef.current !== null) {
        window.clearTimeout(blowOutTimeoutRef.current)
      }
    }
  }, [])


  /*
   * ==========================================================
   * CAKE ASSEMBLED
   * ==========================================================
   */

  const handleAssembled =
    useCallback(() => {
      setAssembled(true)
    }, [])


  /*
   * ==========================================================
   * BLOW CANDLE
   * ==========================================================
   */

  const handleBlowOut =
    useCallback(() => {
      setPhase('blowOut')

      if (blowOutTimeoutRef.current !== null) {
        window.clearTimeout(blowOutTimeoutRef.current)
      }

      blowOutTimeoutRef.current =
        window.setTimeout(() => {
          setPhase('wishMoment')
          blowOutTimeoutRef.current = null
        }, 1600)
    }, [])


  /*
   * ==========================================================
   * CAKE VISIBILITY
   * ==========================================================
   */

  const showCakeScene =
    phase === 'cakeAssembly' ||
    phase === 'blowOut'


  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className={styles.page}>

      {/* ======================================================
          COUNTDOWN / FIREWORKS
      ====================================================== */}

      <AnimatePresence mode="wait">

        {phase === 'countdown' && (
          <motion.div
            key="countdown"
            exit={{
              opacity: 0,
            }}
          >
            <CountdownPhase
              targetDate={
                BIRTHDAY_TARGET
              }
              onComplete={() =>
                setPhase(
                  'fireworks',
                )
              }
            />
          </motion.div>
        )}


        {phase === 'fireworks' && (
          <motion.div
            key="fireworks"
            exit={{
              opacity: 0,
            }}
          >
            <FireworksPhase
              onComplete={() =>
                setPhase(
                  'cakeAssembly',
                )
              }
            />
          </motion.div>
        )}

      </AnimatePresence>


      {/* ======================================================
          CAKE SCENE
      ====================================================== */}

      {showCakeScene && (
        <div
          className={
            styles.cakeScene
          }
        >

          <CakeAssembly
            onAssembled={
              handleAssembled
            }
            blown={
              phase === 'blowOut'
            }
          />

          {assembled &&
            phase ===
              'cakeAssembly' && (
              <button
                type="button"
                className={
                  styles.cta
                }
                onClick={
                  handleBlowOut
                }
              >
                Blow the Candle 🕯️
              </button>
            )}

        </div>
      )}


      {/* ======================================================
          WISH MOMENT
      ====================================================== */}

      {phase === 'wishMoment' && (
        <WishMoment onComplete={onComplete} />
      )}

    </div>
  )
}
