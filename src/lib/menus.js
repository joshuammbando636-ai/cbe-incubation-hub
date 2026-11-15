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
export const STUDENT_MENU = [
  { to: '/student', label: 'Home', end: true, icon: House },
  { to: '/student/profile', label: 'Profile', icon: User },
  { to: '/student/idea', label: 'My idea', icon: Lightbulb },
  { to: '/student/progress', label: 'Progress', icon: TrendingUp },
  { to: '/student/lessons', label: 'Lessons', icon: BookOpen },
  { to: '/student/notices', label: 'Notices', icon: Megaphone },
]

export const STAFF_MENU = [
  { to: '/staff', label: 'Overview', end: true, icon: LayoutDashboard },
  { to: '/staff/students', label: 'Students', icon: Users },
  { to: '/staff/reviews', label: 'Reviews', icon: CircleCheck },
  { to: '/staff/lessons', label: 'Lessons', icon: BookOpen },
  { to: '/staff/meetings', label: 'Meetings', icon: Video },
  { to: '/staff/notices', label: 'Notices', icon: Megaphone },
]

export const ADMIN_MENU = [
  ...STAFF_MENU,
  { to: '/admin/people', label: 'People', icon: UserCog },
  { to: '/admin/lists', label: 'Lists', icon: ListChecks },
]
