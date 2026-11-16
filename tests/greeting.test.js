import { describe, expect, it } from 'vitest'
import { staffGreeting } from '../src/lib/greeting.js'

const at = (hour) => new Date(2026, 10, 16, hour, 0)

describe('staff greeting', () => {
  it('uses the time of day, a title and the surname', () => {
    expect(staffGreeting({ full_name: 'Joshua Godwin', gender: 'male' }, at(9))).toBe('Good morning, Mr. Godwin.')
    expect(staffGreeting({ full_name: 'Neema  Said Juma', gender: 'female' }, at(14))).toBe(
      'Good afternoon, Ms. Juma.',
    )
  })

  it('uses the full name when the gender is not known', () => {
    expect(staffGreeting({ full_name: 'Baraka Mushi', gender: null }, at(19))).toBe('Good evening, Baraka Mushi.')
  })

  it('still greets someone with no name', () => {
    expect(staffGreeting({ full_name: '' }, at(8))).toBe('Good morning.')
  })
})
