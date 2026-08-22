'use client'

import {
  useCallback,
  useState,
} from 'react'

import {
  AnimatePresence,
  motion,
} from 'framer-motion'

import { BIRTHDAY_TARGET } from '../../config'

import { CountdownPhase } from './CountdownPhase'
import { FireworksPhase } from './FireworksPhase'
import CakeAssembly from './CakeAssembly'
import { CelebrationPhase } from './CelebrationPhase'

import type { Page1State } from './types'

import styles from './Page1.module.css'


export interface Page1Props {
  onComplete: () => void
}


export function Page1({
  onComplete,
}: Page1Props) {
  const [phase, setPhase] =
    useState<Page1State>(
      'countdown',
    )

  const [assembled, setAssembled] =
    useState(false)

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

          <img
            className={styles.birthdayImage}
            src="/Happy-Birthday.png"
            alt=""
            aria-hidden="true"
          />

          <CakeAssembly
            onAssembled={
              handleAssembled
            }
            blown={
              phase === 'blowOut'
            }
          />

          {phase === 'blowOut' && (
            <CelebrationPhase onComplete={onComplete} />
          )}

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


    </div>
  )
}
