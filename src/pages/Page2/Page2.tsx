import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../supabaseClient'
import styles from './Page2.module.css'

export interface Page2Props {
  onComplete: () => void
}

type NoteColor = 'pink' | 'lilac' | 'yellow' | 'mint' | 'blue'
type WishRow = {
  id: number | string
  sender_name: string
  message: string
  color: string
  sticker: string
  created_at: string
}

type Wish = WishRow & { tilt: string }

const COLORS: { value: NoteColor; label: string }[] = [
  { value: 'pink', label: 'Pink' },
  { value: 'lilac', label: 'Lilac' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'mint', label: 'Mint' },
  { value: 'blue', label: 'Blue' },
]
const STICKERS = ['🎉', '💖', '🎂', '✨', '👑', '🦄', '🧸']
const makeConfetti = () => Array.from({ length: 28 }, (_, index) => ({
  id: `${Date.now()}-${index}`,
  left: `${42 + Math.random() * 16}%`,
  color: ['#ff7eb6', '#fce38a', '#93e6c5', '#bba3ff', '#8bd9ff'][index % 5],
  delay: `${Math.random() * 180}ms`,
}))

export function Page2({ onComplete }: Page2Props) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [color, setColor] = useState<NoteColor>('pink')
  const [sticker, setSticker] = useState('✨')
  const [confetti, setConfetti] = useState<ReturnType<typeof makeConfetti>>([])

  useEffect(() => {
    let mounted = true
    const loadWishes = async () => {
      const { data, error: fetchError } = await supabase
        .from('wishes')
        .select('id, sender_name, message, color, sticker, created_at')
        .order('created_at', { ascending: false })

      if (!mounted) return
      if (fetchError) {
        console.error('Failed to load wishes:', fetchError)
        setError('Wishes could not be loaded right now.')
      } else {
        setWishes((data as WishRow[]).map((wish, index) => ({
          ...wish,
          tilt: index % 2 === 0 ? '-2deg' : '2deg',
        })))
      }
      setIsLoading(false)
    }

    void loadWishes()
    const channel = supabase
      .channel('wishes-wall')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, (payload) => {
        const wish = payload.new as WishRow
        setWishes((current) => current.some((item) => item.id === wish.id)
          ? current
          : [{ ...wish, tilt: current.length % 2 === 0 ? '-2deg' : '2deg' }, ...current])
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') setError('Live updates are unavailable right now.')
      })

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (confetti.length === 0) return
    const timeout = window.setTimeout(() => setConfetti([]), 1400)
    return () => window.clearTimeout(timeout)
  }, [confetti])

  const submitWish = async () => {
    if (!name.trim() || !message.trim()) return
    setIsSaving(true)
    setError(null)
    const { data, error: insertError } = await supabase
      .from('wishes')
      .insert({ sender_name: name.trim(), message: message.trim(), color, sticker })
      .select('id, sender_name, message, color, sticker, created_at')
      .single()

    if (insertError || !data) {
      console.error('Failed to save wish:', insertError)
      setError('Your wish could not be saved. Please try again.')
      setIsSaving(false)
      return
    }

    const savedWish = data as WishRow
    setWishes((current) => current.some((wish) => wish.id === savedWish.id)
      ? current
      : [{ ...savedWish, tilt: current.length % 2 === 0 ? '-2deg' : '2deg' }, ...current])
    setName('')
    setMessage('')
    setColor('pink')
    setSticker('✨')
    setIsModalOpen(false)
    setConfetti(makeConfetti())
    setIsSaving(false)
  }

  return (
    <main className={styles.page}>
      <div className={styles.ambientGlow} aria-hidden="true" />
      <header className={styles.header}>
        <p className={styles.eyebrow}>A little corner of the internet, just for you</p>
        <h1>Digital Wish Wall</h1>
        <p className={styles.intro}>Leave a tiny piece of love for Arfa and watch the wall bloom.</p>
        <button type="button" className={styles.addButton} onClick={() => setIsModalOpen(true)}>
          <span aria-hidden="true">＋</span> Pin a wish
        </button>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}
      <section className={styles.wall} aria-label="Birthday wishes">
        {isLoading && <p className={styles.status}>Loading wishes...</p>}
        {!isLoading && wishes.length === 0 && <p className={styles.status}>Be the first to pin a wish.</p>}
        {wishes.map((wish) => (
          <article
            className={`${styles.note} ${styles[wish.color]}`}
            style={{ '--tilt': wish.tilt } as CSSProperties}
            key={wish.id}
          >
            <span className={styles.pin} aria-hidden="true">{wish.sticker}</span>
            <p className={styles.noteMessage}>{wish.message}</p>
            <footer>— {wish.sender_name}</footer>
          </article>
        ))}
      </section>

      <nav className={styles.bottomBar} aria-label="Page navigation">
        <span><i aria-hidden="true" /> Page 2 of 6</span>
        <button type="button" className={styles.nextButton} onClick={onComplete}>Next Page <span aria-hidden="true">→</span></button>
      </nav>

      {confetti.map((piece) => <i className={styles.confetti} style={{ left: piece.left, background: piece.color, animationDelay: piece.delay }} key={piece.id} aria-hidden="true" />)}

      {isModalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setIsModalOpen(false)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="wish-dialog-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.closeButton} onClick={() => setIsModalOpen(false)} aria-label="Close wish form">×</button>
            <p className={styles.eyebrow}>Add some sparkle</p>
            <h2 id="wish-dialog-title">Pin a birthday wish</h2>
            <label>Name / nickname<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" maxLength={32} /></label>
            <label>Your message<textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write something lovely..." maxLength={180} rows={4} /></label>
            <fieldset><legend>Note color</legend><div className={styles.colorPicker}>{COLORS.map((option) => <button type="button" className={`${styles.swatch} ${styles[option.value]} ${color === option.value ? styles.selected : ''}`} onClick={() => setColor(option.value)} aria-label={option.label} aria-pressed={color === option.value} key={option.value} />)}</div></fieldset>
            <fieldset><legend>Pin a sticker</legend><div className={styles.stickerPicker}>{STICKERS.map((option) => <button type="button" className={`${styles.stickerOption} ${sticker === option ? styles.selected : ''}`} onClick={() => setSticker(option)} aria-label={`Choose ${option}`} aria-pressed={sticker === option} key={option}>{option}</button>)}</div></fieldset>
            <button type="button" className={styles.submitButton} onClick={() => void submitWish()} disabled={isSaving || !name.trim() || !message.trim()}>{isSaving ? 'Saving...' : 'Add to the wall'} <span aria-hidden="true">✦</span></button>
          </section>
        </div>
      )}
    </main>
  )
}

export default Page2
