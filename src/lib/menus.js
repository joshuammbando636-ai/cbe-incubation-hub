import {
  BookOpen,
  CircleCheck,
  House,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Megaphone,
  TrendingUp,
  User,
  UserCog,
  Users,
  Video,
} from 'lucide-react'

// Menu items for the signed-in pages (content.md). The icon sits beside the label.
// Students: in the order they work. `foot` items sit at the bottom, by Sign out.
// On phones the first four show in the bottom bar; the rest are under "More".
export const STUDENT_MENU = [
  { to: '/student', label: 'Home', end: true, icon: House },
  { to: '/student/idea', label: 'My idea', short: 'Idea', icon: Lightbulb },
  { to: '/student/progress', label: 'Progress', icon: TrendingUp },
  { to: '/student/lessons', label: 'Lessons', icon: BookOpen },
  { to: '/student/notices', label: 'Notices', icon: Megaphone },
  { to: '/student/profile', label: 'Profile', icon: User, foot: true },
]

export const TAB_COUNT = 4

export const STAFF_MENU = [
  { to: '/staff', label: 'Overview', end: true, icon: LayoutDashboard },
  { to: '/staff/students', label: 'Students', icon: Users },
  { to: '/staff/reviews', label: 'Reviews', icon: CircleCheck },
  { to: '/staff/lessons', label: 'Lessons', icon: BookOpen },
  { to: '/staff/meetings', label: 'Meetings', icon: Video },
  { to: '/staff/notices', label: 'Notices', icon: Megaphone },
  { to: '/staff/profile', label: 'Profile', icon: User, foot: true },
]

// Admins see everyone on the Students page, so it is called People for them.
export const ADMIN_MENU = [
  ...STAFF_MENU.map((item) => (item.to === '/staff/students' ? { ...item, label: 'People', icon: UserCog } : item)),
  { to: '/admin/lists', label: 'Lists', icon: ListChecks },
]
