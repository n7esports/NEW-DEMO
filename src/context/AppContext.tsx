import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { AppAction, AppContextType, AppState, UserData } from '../types'

// Maps each AppState to the numeric page it belongs to, so components can
// derive `currentPage` without duplicating that logic everywhere.
const STATE_TO_PAGE: Record<AppState, number> = {
  'page1-countdown': 1,
  'page1-fireworks': 1,
  'page1-cake': 1,
  'page1-wish': 1,
  'page1-blowout': 1,
  'page1-balloons': 1,
  'page2-photobooth': 2,
  'page3-music': 3,
  'page4-locker': 4,
  'page4-gallery': 4,
  'page5-letter': 5,
  'page6-feedback': 6,
  'page6-closing': 6,
  complete: 7,
}

interface ReducerState {
  currentState: AppState
  userData: UserData
}

function reducer(state: ReducerState, action: AppAction): ReducerState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, currentState: action.payload }
    case 'NEXT_PAGE': {
      const nextPageStart: Partial<Record<number, AppState>> = {
        1: 'page2-photobooth',
        2: 'page3-music',
        3: 'page4-locker',
        4: 'page5-letter',
        5: 'page6-feedback',
        6: 'complete',
      }
      const currentPage = STATE_TO_PAGE[state.currentState]
      const next = nextPageStart[currentPage]
      return next ? { ...state, currentState: next } : state
    }
    case 'PREV_PAGE': {
      const prevPageStart: Partial<Record<number, AppState>> = {
        2: 'page1-countdown',
        3: 'page2-photobooth',
        4: 'page3-music',
        5: 'page4-locker',
        6: 'page5-letter',
      }
      const currentPage = STATE_TO_PAGE[state.currentState]
      const prev = prevPageStart[currentPage]
      return prev ? { ...state, currentState: prev } : state
    }
    case 'UPDATE_USER_DATA':
      return { ...state, userData: { ...state.userData, ...action.payload } }
    default:
      return state
  }
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    currentState: 'page1-countdown' as AppState,
    userData: { name: '', birthday: '', wishText: '' },
  })

  const value: AppContextType = {
    currentPage: STATE_TO_PAGE[state.currentState],
    currentState: state.currentState,
    dispatch,
    userData: state.userData,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider')
  return ctx
}
