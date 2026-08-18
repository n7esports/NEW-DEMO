import { AppProvider, useAppContext } from './context/AppContext'
import { CustomCursor } from './components/CustomCursor/CustomCursor'
import { Page1 } from './pages/Page1/Page1'
import styles from './App.module.css'

function Router() {
  const { currentPage, dispatch } = useAppContext()

  if (currentPage === 1) {
    return <Page1 onComplete={() => dispatch({ type: 'NEXT_PAGE' })} />
  }

  // Pages 2–6 are built next, page by page. This placeholder keeps the
  // state machine navigable in the meantime.
  return (
    <div className={styles.placeholder}>
      <p className={styles.placeholderEmoji}>🚧</p>
      <h1>Page {currentPage} is coming soon</h1>
      <p>The photo booth, music player, DOB vault, letter, and finale are built next, one page at a time.</p>
      <button type="button" className={styles.replayBtn} onClick={() => dispatch({ type: 'SET_STATE', payload: 'page1-countdown' })}>
        ↺ Replay Page 1
      </button>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <CustomCursor />
      <Router />
    </AppProvider>
  )
}
