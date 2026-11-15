import { MSG, required } from './text.js'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const cleanEmail = (value) => value.trim().toLowerCase()

export function checkEmail(value) {
  const v = value.trim()
  if (!v) return required('email')
  if (!EMAIL.test(v)) return MSG.badEmail
  return ''
}

export function checkNewPassword(value) {
  if (!value) return required('password')
  if (value.length < 8) return MSG.shortPassword
  return ''
}

export function checkSamePassword(password, confirm) {
  return password === confirm ? '' : MSG.passwordsDiffer
}

// Real names only: at least first and last name, letters (any language),
// with spaces, hyphens, apostrophes or dots between. No numbers, emoji or nicknames like "Kingboy254".
const NAME_WORD = /^\p{L}[\p{L}\p{M}'’.-]*$/u
export function checkFullName(value) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return required('full name')
  if (!words.every((w) => NAME_WORD.test(w))) return MSG.badName
  if (words.length < 2 || words.filter((w) => w.replace(/[^\p{L}]/gu, '').length >= 2).length < 2) return MSG.badName
  return ''
}

export function checkRequired(value, field) {
  return value.trim() ? '' : required(field)
}

// Returns the first field with an error, so the form can focus it.
export function firstError(errors) {
  return Object.keys(errors).find((k) => errors[k]) || null
}
