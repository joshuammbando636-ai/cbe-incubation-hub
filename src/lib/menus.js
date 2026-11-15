// Menu items for the signed-in pages (content.md).
export const STUDENT_MENU = [
  { to: '/student', label: 'Home', end: true },
  { to: '/student/profile', label: 'Profile' },
  { to: '/student/idea', label: 'My idea' },
  { to: '/student/progress', label: 'Progress' },
  { to: '/student/lessons', label: 'Lessons' },
  { to: '/student/notices', label: 'Notices' },
]

export const STAFF_MENU = [
  { to: '/staff', label: 'Overview', end: true },
  { to: '/staff/students', label: 'Students' },
  { to: '/staff/reviews', label: 'Reviews' },
  { to: '/staff/lessons', label: 'Lessons' },
  { to: '/staff/meetings', label: 'Meetings' },
  { to: '/staff/notices', label: 'Notices' },
]

export const ADMIN_MENU = [
  ...STAFF_MENU,
  { to: '/admin/people', label: 'People' },
  { to: '/admin/lists', label: 'Lists' },
]
