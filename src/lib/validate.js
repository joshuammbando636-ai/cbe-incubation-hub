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

export function checkRequired(value, field) {
  return value.trim() ? '' : required(field)
}

// Returns the first field with an error, so the form can focus it.
export function firstError(errors) {
  return Object.keys(errors).find((k) => errors[k]) || null
}
