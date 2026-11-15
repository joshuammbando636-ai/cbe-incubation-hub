import { describe, expect, it } from 'vitest'
import { NO_IDEA, filterStudents, studentCount, summarize } from '../src/lib/staff.js'

const hubs = [
  { id: 'h1', name: 'Smart Logistics Hub' },
  { id: 'h2', name: 'HR Tech Hub' },
]
const campuses = [
  { id: 'c1', name: 'Dar es Salaam' },
  { id: 'c2', name: 'Dodoma' },
]
const rows = [
  { id: '1', full_name: 'Amina Juma', reg_number: '03.111.01', email: 'amina@x.tz', hub_id: 'h1', campus_id: 'c1', programme_id: 'p1', needs_review: false, stage: 'idea', waiting: 1 },
  { id: '2', full_name: 'Baraka Mushi', reg_number: null, email: 'baraka@x.tz', hub_id: 'h1', campus_id: 'c2', programme_id: 'p2', needs_review: true, stage: null, waiting: 0 },
  { id: '3', full_name: 'Neema Said', reg_number: '03.222.01', email: 'neema@x.tz', hub_id: 'h2', campus_id: 'c1', programme_id: 'p1', needs_review: false, stage: 'prototype', waiting: 2 },
  { id: '4', full_name: 'No Hub', reg_number: null, email: 'nohub@x.tz', hub_id: null, campus_id: null, programme_id: null, needs_review: false, stage: null, waiting: 0 },
]

describe('summarize', () => {
  it('counts the four numbers and each hub', () => {
    const s = summarize(rows, hubs)
    expect(s).toMatchObject({ students: 4, withIdea: 2, waiting: 3, toConfirm: 1 })
    expect(s.byHub).toEqual([
      { id: 'h1', name: 'Smart Logistics Hub', students: 2, withIdea: 1, waiting: 1 },
      { id: 'h2', name: 'HR Tech Hub', students: 1, withIdea: 1, waiting: 2 },
      { id: null, name: 'Not chosen yet', students: 1, withIdea: 0, waiting: 0 },
    ])
  })

  it('counts each stage, plus students with no idea', () => {
    expect(summarize(rows, hubs).byStage.map((s) => [s.value, s.students])).toEqual([
      ['idea', 1],
      ['prototype', 1],
      ['operational', 0],
      ['revenue_generating', 0],
      [NO_IDEA, 2],
    ])
  })

  it('counts each campus too', () => {
    expect(summarize(rows, hubs, campuses).byCampus).toEqual([
      { id: 'c1', name: 'Dar es Salaam', students: 2, withIdea: 2, waiting: 3 },
      { id: 'c2', name: 'Dodoma', students: 1, withIdea: 0, waiting: 0 },
      { id: null, name: 'Not chosen yet', students: 1, withIdea: 0, waiting: 0 },
    ])
  })

  it('has no "Not chosen yet" row when every student has a hub', () => {
    expect(summarize(rows.slice(0, 3), hubs).byHub).toHaveLength(2)
  })
})

describe('filterStudents', () => {
  const ids = (f) => filterStudents(rows, f).map((r) => r.id)

  it('searches name, registration number and email, any order of words', () => {
    expect(ids({ q: 'juma amina' })).toEqual(['1'])
    expect(ids({ q: '03.222' })).toEqual(['3'])
    expect(ids({ q: 'BARAKA@X' })).toEqual(['2'])
    expect(ids({ q: '  ' })).toEqual(['1', '2', '3', '4'])
  })

  it('filters by hub, stage, no idea and to confirm', () => {
    expect(ids({ hub: 'h1' })).toEqual(['1', '2'])
    expect(ids({ stage: 'prototype' })).toEqual(['3'])
    expect(ids({ stage: NO_IDEA })).toEqual(['2', '4'])
    expect(ids({ confirm: true })).toEqual(['2'])
    expect(ids({ hub: 'h1', stage: NO_IDEA, confirm: true })).toEqual(['2'])
  })

  it('filters by campus and programme', () => {
    expect(ids({ campus: 'c1' })).toEqual(['1', '3'])
    expect(ids({ programme: 'p2' })).toEqual(['2'])
    expect(ids({ campus: 'c1', hub: 'h2', programme: 'p1' })).toEqual(['3'])
  })

  it('count wording', () => {
    expect(studentCount(1)).toBe('1 student')
    expect(studentCount(0)).toBe('0 students')
  })
})
