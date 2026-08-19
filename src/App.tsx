import { AppProvider, useAppContext } from './context/AppContext'
import { CustomCursor } from './components/CustomCursor/CustomCursor'
import { Page1 } from './pages/Page1/Page1'
import { Page2 } from './pages/Page2/Page2'
import { Page3 } from './pages/Page3/Page3'
import { Page4 } from './pages/page4/Page4'
import styles from './App.module.css'

function Router() {
  const { currentPage, dispatch } = useAppContext()
  const next = () => dispatch({ type: 'NEXT_PAGE' })

  if (currentPage === 1) return <Page1 onComplete={next} />
  if (currentPage === 2) return <Page2 onComplete={next} />
  if (currentPage === 3) return <Page3 onComplete={next} />
  if (currentPage === 4) return <Page4 onComplete={next} />

  return (
    <div className={styles.placeholder}>
      <p className={styles.placeholderEmoji}>🚧</p>
      <h1>Page {currentPage} is coming soon</h1>
      <p>The letter and finale are built next.</p>
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
