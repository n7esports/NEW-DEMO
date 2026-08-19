import jsPDF from 'jspdf'
import type { UserData } from '../../types'

/**
 * Builds the default letter body from whatever the user has typed in so far
 * (name, wish). Feel free to replace this with a fully custom letter —
 * TypewriterLetter just takes a plain string.
 */
export function buildLetterText(userData: UserData): string {
  const name = userData.name.trim() || 'you'
  const wishLine = userData.wishText.trim()
    ? `I heard what you wished for — "${userData.wishText.trim()}" — and I hope every bit of it comes true this year.\n\n`
    : ''

  return `Dear ${name},

Another year has come around, and I couldn't let it pass without telling you how much you mean to me.

${wishLine}Thank you for being exactly who you are — thoughtful, funny, and endlessly kind. This next chapter is going to be a good one, and I'm so glad I get to watch it unfold.

Happy birthday. Here's to you.

With love,
Someone who adores you 🎂`
}

/** Renders the letter text into a simple, clean PDF and triggers a download. */
export function downloadLetterPdf(text: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)

  const margin = 56
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const maxWidth = pageWidth - margin * 2
  const lineHeight = 18

  let y = margin
  for (const paragraph of text.split('\n')) {
    if (paragraph.trim() === '') {
      y += lineHeight
      continue
    }
    const wrapped: string[] = doc.splitTextToSize(paragraph, maxWidth)
    for (const line of wrapped) {
      if (y > pageHeight - margin) {
        doc.addPage()
        y = margin
      }
      doc.text(line, margin, y)
      y += lineHeight
    }
  }

  doc.save('birthday-letter.pdf')
}
