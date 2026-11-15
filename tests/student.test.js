import { describe, expect, it } from 'vitest'
import { STAGES, firstName, formatDate, stageLabel, stagesAbove } from '../src/lib/labels.js'
import {
  checkGradYear,
  checkPhone,
  checkRegNumber,
  cleanPhone,
  cleanRegNumber,
  countDone,
  missingDetails,
  missingLabel,
} from '../src/lib/student.js'
import { MSG } from '../src/lib/text.js'
import { isYoutubeLink, linkKind, youtubeId } from '../src/lib/youtube.js'

describe('labels', () => {
  it('stages use CBE wording, in order', () => {
    expect(STAGES.map((s) => s.label)).toEqual(['Idea Stage', 'Prototype Stage', 'Operational', 'Revenue Generating'])
    expect(stageLabel('revenue_generating')).toBe('Revenue Generating')
    expect(stagesAbove('prototype').map((s) => s.value)).toEqual(['operational', 'revenue_generating'])
    expect(stagesAbove('revenue_generating')).toEqual([])
  })

  it('dates look like 14 Nov 2026', () => {
    expect(formatDate('2026-11-14T12:00:00')).toBe('14 Nov 2026')
    expect(formatDate('2026-09-03T12:00:00')).toBe('3 Sep 2026')
    expect(formatDate(null)).toBe('')
    expect(formatDate('nonsense')).toBe('')
  })

  it('first name', () => {
    expect(firstName('  Amina   Juma ')).toBe('Amina')
    expect(firstName('')).toBe('')
  })
})

describe('profile checks', () => {
  it('registration number', () => {
    expect(checkRegNumber('')).toBe('')
    expect(checkRegNumber('03.12345.01.01.2026')).toBe('')
    expect(checkRegNumber(' 03.12345.01.01.2026 ')).toBe('')
    expect(checkRegNumber('03.12345.13.08.2026.')).toBe('')
    expect(cleanRegNumber('03.12345.13.08.2026.')).toBe('03.12345.13.08.2026')
    expect(checkRegNumber('03-12345')).toBe(MSG.badRegNumber)
    expect(checkRegNumber('12345')).toBe(MSG.badRegNumber)
  })

  it('phone numbers are stored as 0712345678', () => {
    expect(cleanPhone('0712 345 678')).toBe('0712345678')
    expect(cleanPhone('+255 712 345 678')).toBe('0712345678')
    expect(cleanPhone('255-712-345-678')).toBe('0712345678')
    expect(checkPhone('0712 345 678')).toBe('')
    expect(checkPhone('+255712345678')).toBe('')
    expect(checkPhone('12345')).toBe(MSG.badPhone)
    expect(checkPhone('')).toBe('')
  })

  it('graduation year', () => {
    expect(checkGradYear('2027')).toBe('')
    expect(checkGradYear('')).toBe('')
    expect(checkGradYear('27')).toBe(MSG.badYear)
    expect(checkGradYear('3027')).toBe(MSG.badYear)
  })

  it('counts missing details, ignoring programme', () => {
    expect(missingDetails({ full_name: 'A', programme_id: null })).toBe(9)
    const full = {
      full_name: 'A',
      reg_number: '1.2.3',
      gender: 'male',
      phone: '0712345678',
      campus_id: 'x',
      department_id: 'x',
      level_id: 'x',
      grad_year: 2027,
      cluster_id: 'x',
      hub_id: 'x',
      programme_id: null,
    }
    expect(missingDetails(full)).toBe(0)
    expect(missingLabel(1)).toBe('1 detail missing')
    expect(missingLabel(3)).toBe('3 details missing')
  })
})

describe('YouTube links', () => {
  it('reads the id from common link shapes', () => {
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ?si=abc')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(youtubeId(' https://www.youtube.com/live/dQw4w9WgXcQ ')).toBe('dQw4w9WgXcQ')
  })

  it('refuses other sites and lookalikes', () => {
    expect(isYoutubeLink('https://vimeo.com/123456')).toBe(false)
    expect(isYoutubeLink('https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ')).toBe(false)
    expect(isYoutubeLink('javascript:alert(1)')).toBe(false)
    expect(isYoutubeLink('https://www.youtube.com/')).toBe(false)
    expect(isYoutubeLink('youtu.be/dQw4w9WgXcQ')).toBe(false)
  })

  it('sorts saved links for display', () => {
    expect(linkKind('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube')
    expect(linkKind('https://drive.google.com/file/1')).toBe('web')
    expect(linkKind('javascript:alert(1)')).toBe('bad')
    expect(linkKind('not a link')).toBe('bad')
  })
})

it('counts finished lessons among the ones shown', () => {
  const lessons = [{ id: 'a' }, { id: 'b' }]
  expect(countDone(lessons, new Set(['a', 'zzz']))).toBe(1)
})
