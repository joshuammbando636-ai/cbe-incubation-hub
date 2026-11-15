import { describe, expect, it } from 'vitest'
import {
  countNew,
  formatDateTime,
  fromLocalInput,
  isMeetingLink,
  isWebLink,
  meetingAudience,
  meetingTag,
  noticeAudience,
  splitMeetings,
  toLocalInput,
} from '../src/lib/notices.js'

describe('dates and times', () => {
  it('formats a meeting time like "Wed 18 Nov 2026, 14:05"', () => {
    expect(formatDateTime(new Date(2026, 10, 18, 14, 5))).toBe('Wed 18 Nov 2026, 14:05')
    expect(formatDateTime('nonsense')).toBe('')
  })

  it('goes to and from the date-time input without shifting', () => {
    const d = new Date(2026, 10, 18, 9, 30)
    expect(toLocalInput(d)).toBe('2026-11-18T09:30')
    expect(fromLocalInput('2026-11-18T09:30')).toBe(d.toISOString())
    expect(fromLocalInput('')).toBe('')
    expect(fromLocalInput('18/11/2026')).toBe('')
  })
})

describe('links', () => {
  it('meeting links must be https; notice links may be http or https', () => {
    expect(isMeetingLink('https://meet.google.com/abc-defg-hij')).toBe(true)
    expect(isMeetingLink(' https://zoom.us/j/123 ')).toBe(true)
    expect(isMeetingLink('http://zoom.us/j/123')).toBe(false)
    expect(isMeetingLink('javascript:alert(1)')).toBe(false)
    expect(isWebLink('http://cbe.ac.tz/form')).toBe(true)
    expect(isWebLink('mailto:x@y.z')).toBe(false)
  })
})

describe('meetings', () => {
  const now = new Date(2026, 10, 18, 12, 0)
  const at = (h) => new Date(2026, 10, 18, h, 0).toISOString()
  const list = [
    { id: 'later', starts_at: at(16) },
    { id: 'old', starts_at: at(8) },
    { id: 'running', starts_at: at(11) },
    { id: 'soon', starts_at: at(13) },
  ]

  it('keeps a meeting "coming up" for 2 hours after it starts', () => {
    const { upcoming, past } = splitMeetings(list, now)
    expect(upcoming.map((m) => m.id)).toEqual(['running', 'soon', 'later'])
    expect(past.map((m) => m.id)).toEqual(['old'])
  })

  it('says who a meeting is for', () => {
    const hubs = [{ id: 'h1', name: 'HR Tech Hub' }]
    const students = [{ id: 's1', full_name: 'Amina Juma' }]
    expect(meetingAudience({ hub_id: null, student_id: null }, hubs, students)).toBe('Everyone')
    expect(meetingAudience({ hub_id: 'h1' }, hubs, students)).toBe('HR Tech Hub')
    expect(meetingAudience({ student_id: 's1' }, hubs, students)).toBe('Amina Juma')
    expect(meetingTag({ student_id: 's1' })).toBe('For you')
    expect(meetingTag({ hub_id: 'h1' })).toBe('For your hub')
    expect(meetingTag({})).toBe('For everyone')
  })
})

describe('notices', () => {
  const lists = {
    campuses: [{ id: 'c1', name: 'Dar es Salaam' }],
    hubs: [{ id: 'h1', name: 'HR Tech Hub' }],
    programmes: [{ id: 'p1', name: 'Accountancy' }],
  }

  it('says who a notice is for', () => {
    expect(noticeAudience({}, lists)).toBe('Everyone')
    expect(noticeAudience({ campus_id: 'c1', programme_id: 'p1' }, lists)).toBe('Dar es Salaam · Accountancy')
    expect(noticeAudience({ hub_id: 'h1' }, lists)).toBe('HR Tech Hub')
  })

  it('counts notices posted since the last visit', () => {
    const notices = [{ created_at: '2026-11-10T10:00:00Z' }, { created_at: '2026-11-15T10:00:00Z' }]
    expect(countNew(notices, '')).toBe(2)
    expect(countNew(notices, '2026-11-12T00:00:00Z')).toBe(1)
    expect(countNew(notices, '2026-11-16T00:00:00Z')).toBe(0)
  })
})
