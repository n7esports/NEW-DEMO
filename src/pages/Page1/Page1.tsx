'use client'

import {
  useCallback,
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

import RoomScene from './Sky of Wishes/RoomScene'
import SkyOfWishes from './Sky of Wishes/SkyOfWishes'
import { useSkyTransition } from './Sky of Wishes/useSkyTransition'

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


  /*
   * ==========================================================
   * SKY TRANSITION
   * ==========================================================
   */

  const skyTransition =
    useSkyTransition({
      duration: 6500,

      autoStart:
        phase === 'skyOfWishes',

      onComplete,
    })


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

      window.setTimeout(() => {
        setPhase('skyOfWishes')
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
          SKY OF WISHES
      ====================================================== */}

      {phase ===
        'skyOfWishes' && (
        <div
          className={
            styles.skyScene
          }
        >

          {/* ==================================================
              ROOM
          ================================================== */}

          <div
            className={
              styles.roomLayer
            }
            style={{
              opacity:
                1 -
                skyTransition.progress,
              pointerEvents:
                skyTransition
                  .isRoomVisible
                  ? 'auto'
                  : 'none',
            }}
          >
            <RoomScene
              transitionProgress={
                skyTransition.progress
              }
            />
          </div>


          {/* ==================================================
              SKY
          ================================================== */}

          <div
            className={
              styles.skyLayer
            }
            style={{
              opacity:
                skyTransition.progress,
              pointerEvents:
                'none',
            }}
          >
            <SkyOfWishes
              transitionProgress={
                skyTransition.progress
              }
              active={
                skyTransition
                  .isSkyVisible
              }
              onComplete={
                undefined
              }
            />
          </div>


          {/* ==================================================
              CINEMATIC TRANSITION FLASH
          ================================================== */}

          <div
            className={
              styles.transitionFlash
            }
            style={{
              opacity:
                skyTransition
                  .progress > 0.38 &&
                skyTransition
                  .progress < 0.58
                  ? 0.12
                  : 0,
            }}
          />

        </div>
      )}

    </div>
  )
}
