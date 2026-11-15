// Fixed wording from content.md ("Words used everywhere").

export const STAGES = [
  { value: 'idea', label: 'Idea Stage', meaning: 'You have an idea but nothing is built yet.' },
  { value: 'prototype', label: 'Prototype Stage', meaning: 'You have a sample, a test version or a first trial.' },
  { value: 'operational', label: 'Operational', meaning: 'The business is running and serving customers.' },
  { value: 'revenue_generating', label: 'Revenue Generating', meaning: 'The business earns money regularly.' },
]

export const stageLabel = (value) => STAGES.find((s) => s.value === value)?.label ?? ''
export const stageIndex = (value) => STAGES.findIndex((s) => s.value === value)
export const stagesAbove = (value) => STAGES.slice(stageIndex(value) + 1)

export const VIDEO_STATUS = {
  pending: 'Waiting for review',
  verified: 'Verified',
  rejected: 'Not accepted',
}

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "14 Nov 2026", in the viewer's own time zone.
export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export const firstName = (fullName = '') => fullName.trim().split(/\s+/)[0] || ''
