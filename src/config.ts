// Everything you'd want to change before sending this to someone lives here,
// instead of being scattered across individual page components.

/** Recipient's name — currently only seeds UserData.name; surface it wherever you like. */
export const RECIPIENT_NAME = 'Friend'

/**
 * The moment the birthday "arrives" (local time). Month is 0-indexed,
 * so 8 = September. The last 10 seconds before this trigger the big
 * bounce-and-beep countdown; before that, a live days/hours/min/sec
 * display is shown instead.
 */
export const BIRTHDAY_TARGET = new Date(2026, 8, 15, 0, 0, 0)

/**
 * The Page 4 "DOB Vault" passcode. This is a lightweight surprise-reveal
 * lock, not real security — it ships in the client bundle and is visible
 * to anyone who opens dev tools or reads the built JS. Don't put anything
 * behind it you actually need to keep private.
 */
export const VAULT_PASSCODE = '1509'

/**
 * Reveals the "Skip Timing" button on Page 1's countdown even in a
 * production build (e.g. a live Vercel deployment), so you can test the
 * flow on the real URL without shipping a visible skip button to whoever
 * receives the link.
 *
 * To use it: visit your deployed URL with ?dev=<this value> appended, e.g.
 *   https://your-app.vercel.app/?dev=letmein-birthday
 * Change this to something unguessable before you send the real link out,
 * or just delete the query param usage in CountdownPhase.tsx once you're
 * done testing.
 */
export const DEV_SKIP_KEY = 'letmein-birthday'
