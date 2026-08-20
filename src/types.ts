// Global application types shared across all pages.
// Individual pages may define their own local types (see pages/Page1/types.ts)
// for state/data that never needs to leave that page.

import type { Dispatch } from 'react'

export type AppState =
  | 'page1-countdown'
  | 'page1-fireworks'
  | 'page1-cake'
  | 'page1-blowout'
  | 'page1-balloons'
  | 'page2-photobooth'
  | 'page3-music'
  | 'page4-locker'
  | 'page4-gallery'
  | 'page5-letter'
  | 'page6-feedback'
  | 'page6-closing'
  | 'complete'

export interface UserData {
  name: string
  birthday: string
  wishText: string
  photoStrip?: string[]
}

export interface AppContextType {
  currentPage: number
  currentState: AppState
  dispatch: Dispatch<AppAction>
  userData: UserData
}

export type AppAction =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'NEXT_PAGE' }
  | { type: 'PREV_PAGE' }
  | { type: 'UPDATE_USER_DATA'; payload: Partial<UserData> }
