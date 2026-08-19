import type { Track } from './types'

// No audio files are bundled — drop mp3s into /public/audio and set audioSrc
// (e.g. '/audio/track-1.mp3') to enable real playback. Without a source, the
// player still works: it simulates a play clock so the vinyl spin and lyric
// sync can be previewed end-to-end.
export const TRACKS: Track[] = [
  {
    id: 'track-1',
    title: 'Another Year Brighter',
    artist: 'For You',
    color: '#FF75A0',
    duration: 30,
    lyrics: [
      { time: 0, text: '♪ instrumental intro ♪' },
      { time: 4, text: "Here's to the year that's just begun" },
      { time: 9, text: 'Another trip around the sun' },
      { time: 14, text: 'Every candle, every wish' },
      { time: 18, text: 'Every moment just like this' },
      { time: 23, text: 'Happy birthday, close your eyes' },
      { time: 27, text: 'Let the whole world harmonize' },
    ],
  },
  {
    id: 'track-2',
    title: 'Confetti Skies',
    artist: 'For You',
    color: '#FCE38A',
    duration: 24,
    lyrics: [
      { time: 0, text: '♪ instrumental intro ♪' },
      { time: 3, text: 'Throw your hands up, let it go' },
      { time: 8, text: 'Confetti falling, soft and slow' },
      { time: 13, text: 'Every year with you shines bright' },
      { time: 18, text: 'Happy birthday, tonight is yours' },
    ],
  },
]
