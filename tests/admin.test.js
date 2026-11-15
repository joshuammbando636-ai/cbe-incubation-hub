import { describe, expect, it } from 'vitest'
import { cleanSearch, diff, roleQuestion } from '../src/lib/admin.js'

describe('admin helpers', () => {
  it('asks the content.md questions before a role change', () => {
    expect(roleQuestion('Amina', 'mentor')).toBe('Make Amina a mentor?')
    expect(roleQuestion('Amina', 'admin')).toBe('Make Amina an admin? Admins can see and change everything.')
    expect(roleQuestion('Amina', 'student')).toBe(
      'Change Amina back to student? They will lose access to student records.',
    )
  })

  it('cleans search text so it cannot break the filter', () => {
    expect(cleanSearch('  amina  ')).toBe('amina')
    expect(cleanSearch('a,b),email.eq.x')).toBe('a b email.eq.x')
    expect(cleanSearch('100%*')).toBe('100')
    expect(cleanSearch('amina@cbe.ac.tz')).toBe('amina@cbe.ac.tz')
  })

  it('works out which hubs to add and remove', () => {
    expect(diff(['a', 'b'], new Set(['b', 'c']))).toEqual({ add: ['c'], remove: ['a'] })
    expect(diff([], ['a'])).toEqual({ add: ['a'], remove: [] })
  })
})
