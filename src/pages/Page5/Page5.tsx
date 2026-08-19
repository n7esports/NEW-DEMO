import { useMemo, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { Envelope } from './Envelope'
import { TypewriterLetter } from './TypewriterLetter'
import { buildLetterText } from './letterUtils'
import styles from './Page5.module.css'

export interface Page5Props {
  onComplete: () => void
}

export function Page5({ onComplete }: Page5Props) {
  const { userData } = useAppContext()
  const [opened, setOpened] = useState(false)
  const letterText = useMemo(() => buildLetterText(userData), [userData])

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>A Letter For You 💌</h1>

      {!opened ? (
        <Envelope onOpen={() => setOpened(true)} />
      ) : (
        <TypewriterLetter text={letterText} onNext={onComplete} />
      )}
    </div>
  )
}
