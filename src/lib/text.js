// Wording from content.md. Change words there first, then here.

export const APP_NAME = 'CBE Incubation Hub'
export const FOOTER = 'College of Business Education · Incubation Hub'

export const MSG = {
  badEmail: 'Enter a valid email address, like name@example.com.',
  shortPassword: 'Use at least 8 characters.',
  passwordsDiffer: 'The two passwords do not match.',
  offline: 'No connection. Check your internet and try again.',
  notAllowed: 'You are not allowed to do that.',
  generic: 'Something went wrong. Please try again.',
  tooManyEmails: 'Too many emails sent. Wait a few minutes and try again.',
  sent: 'Sent. Check your inbox.',
  badRegNumber: 'Use the format on your student ID, like 03.12345.01.01.2026.',
  badName: 'Enter your real first and last name, as on your CBE registration. Letters only, no nicknames.',
  badPhone: 'Enter a phone number, like 0712 345 678.',
  badYear: 'Enter a year, like 2027.',
  badYoutube: 'Paste a YouTube link, like https://youtu.be/abc123.',
  badSavedLink: 'This link cannot be opened.',
  regTaken: 'This registration number is already used by another account. Check it, or ask your mentor for help.',
  wrongProgramme: 'That programme does not belong to the department you chose.',
  loading: 'Loading…',
  saving: 'Saving…',
}

export const required = (field) => `Enter your ${field}.`
export const requiredChoice = (field) => `Choose your ${field}.`

function isOffline(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  if (error.name === 'AuthRetryableFetchError') return true
  return /failed to fetch|networkerror|load failed/i.test(error.message || '')
}

// Turns a Supabase error into one of the fixed messages.
export function errorMessage(error) {
  if (!error) return ''
  if (isOffline(error)) return MSG.offline
  if (error.code === 'over_email_send_rate_limit' || error.status === 429) return MSG.tooManyEmails
  if (error.code === '42501' || error.code === 'P0001') return MSG.notAllowed
  return MSG.generic
}
