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
