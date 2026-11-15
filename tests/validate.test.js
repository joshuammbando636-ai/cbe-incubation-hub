import { describe, expect, it } from 'vitest'
import { MSG, errorMessage } from '../src/lib/text.js'
import { checkEmail, checkNewPassword, checkRequired, checkSamePassword, cleanEmail, firstError } from '../src/lib/validate.js'

describe('form checks use the wording from content.md', () => {
  it('email', () => {
    expect(checkEmail('')).toBe('Enter your email.')
    expect(checkEmail('   ')).toBe('Enter your email.')
    expect(checkEmail('amina')).toBe('Enter a valid email address, like name@example.com.')
    expect(checkEmail('amina@cbe')).toBe(MSG.badEmail)
    expect(checkEmail(' Amina@CBE.ac.tz ')).toBe('')
    expect(cleanEmail(' Amina@CBE.ac.tz ')).toBe('amina@cbe.ac.tz')
  })

  it('passwords', () => {
    expect(checkNewPassword('')).toBe('Enter your password.')
    expect(checkNewPassword('1234567')).toBe('Use at least 8 characters.')
    expect(checkNewPassword('12345678')).toBe('')
    expect(checkSamePassword('abcdefgh', 'abcdefgx')).toBe('The two passwords do not match.')
    expect(checkSamePassword('abcdefgh', '')).toBe(MSG.passwordsDiffer)
    expect(checkSamePassword('abcdefgh', 'abcdefgh')).toBe('')
  })

  it('required text', () => {
    expect(checkRequired('  ', 'full name')).toBe('Enter your full name.')
    expect(checkRequired('Amina', 'full name')).toBe('')
  })

  it('firstError picks the first field in form order', () => {
    expect(firstError({ email: '', password: 'x', confirm: 'y' })).toBe('password')
    expect(firstError({ email: '', password: '' })).toBe(null)
  })
})

describe('errorMessage', () => {
  it('maps Supabase errors to fixed messages', () => {
    expect(errorMessage(null)).toBe('')
    expect(errorMessage({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' })).toBe(MSG.offline)
    expect(errorMessage({ message: 'TypeError: Failed to fetch' })).toBe(MSG.offline)
    expect(errorMessage({ code: 'over_email_send_rate_limit', status: 429 })).toBe(MSG.tooManyEmails)
    expect(errorMessage({ code: '42501', message: 'new row violates row-level security policy' })).toBe(MSG.notAllowed)
    expect(errorMessage({ code: 'P0001', message: 'Only an admin can change roles' })).toBe(MSG.notAllowed)
    expect(errorMessage({ code: 'something_new', message: 'odd' })).toBe(MSG.generic)
  })
})
