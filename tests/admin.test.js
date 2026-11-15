import { describe, expect, it } from 'vitest'
import { diff, filterPeople, roleQuestion } from '../src/lib/admin.js'

describe('admin helpers', () => {
  it('asks the content.md questions before a role change', () => {
    expect(roleQuestion('Amina', 'mentor')).toBe('Make Amina a mentor?')
    expect(roleQuestion('Amina', 'admin')).toBe('Make Amina an admin? Admins can see and change everything.')
    expect(roleQuestion('Amina', 'student')).toBe(
      'Change Amina back to student? They will lose access to student records.',
    )
  })

  it('filters people by role and by words in name or email', () => {
    const people = [
      { full_name: 'Amina Juma', email: 'amina@cbe.ac.tz', role: 'student' },
      { full_name: 'Baraka Mushi', email: 'b.mushi@gmail.com', role: 'mentor' },
      { full_name: '', email: 'new@gmail.com', role: 'student' },
    ]
    const emails = (list) => list.map((p) => p.email)
    expect(emails(filterPeople(people, 'all', ''))).toEqual(['amina@cbe.ac.tz', 'b.mushi@gmail.com', 'new@gmail.com'])
    expect(emails(filterPeople(people, 'student', ''))).toEqual(['amina@cbe.ac.tz', 'new@gmail.com'])
    expect(emails(filterPeople(people, 'all', 'juma AMINA'))).toEqual(['amina@cbe.ac.tz'])
    expect(emails(filterPeople(people, 'all', 'gmail'))).toEqual(['b.mushi@gmail.com', 'new@gmail.com'])
    expect(emails(filterPeople(people, 'mentor', 'amina'))).toEqual([])
  })

  it('works out which hubs to add and remove', () => {
    expect(diff(['a', 'b'], new Set(['b', 'c']))).toEqual({ add: ['c'], remove: ['a'] })
    expect(diff([], ['a'])).toEqual({ add: ['a'], remove: [] })
  })
})
