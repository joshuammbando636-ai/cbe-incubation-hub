import {
  BookOpen,
  CircleCheck,
  House,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Megaphone,
  MessageCircle,
  Plus,
  TrendingUp,
  User,
  UserCog,
  Users,
  Video,
} from 'lucide-react'

// Menu items for the signed-in pages (content.md). The icon sits beside the label.
// Students: in the order they work. `foot` items (Profile) are reached from the
// name in the top bar, so the sidebar leaves them out.
// On phones the first four show in the bottom bar; the rest are under "More".
export const STUDENT_MENU = [
  { to: '/student', label: 'Dashboard', short: 'Home', end: true, icon: House },
  { to: '/student/idea', label: 'My idea', short: 'Idea', icon: Lightbulb },
  { to: '/student/progress', label: 'Progress', icon: TrendingUp },
  { to: '/student/messages', label: 'Messages', short: 'Chat', icon: MessageCircle },
  { to: '/student/lessons', label: 'Lessons', icon: BookOpen },
  { to: '/student/notices', label: 'Notices', icon: Megaphone },
  { to: '/student/profile', label: 'Profile', icon: User, foot: true },
]

export const TAB_COUNT = 4

// The big button at the top of the sidebar: the most common job for each role.
export const STUDENT_ACTION = { to: '/student/progress', label: 'Post an update', icon: Plus }
export const STAFF_ACTION = { to: '/staff/reviews', label: 'Review videos', icon: CircleCheck }

export const STAFF_MENU = [
  { to: '/staff', label: 'Overview', end: true, icon: LayoutDashboard },
  { to: '/staff/students', label: 'Students', icon: Users },
  { to: '/staff/reviews', label: 'Reviews', icon: CircleCheck },
  { to: '/staff/messages', label: 'Messages', icon: MessageCircle },
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
