import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { Home, RequireRole, SignedOutOnly } from './auth/guards.jsx'
import { AppShell, StaffShell } from './components/layouts.jsx'
import { Spinner } from './components/ui.jsx'
import { STUDENT_MENU } from './lib/menus.js'
import { supabase } from './lib/supabase.js'
import { AuthCallback } from './pages/AuthCallback.jsx'
import { CheckEmail } from './pages/CheckEmail.jsx'
import { ForgotPassword } from './pages/ForgotPassword.jsx'
import { Login } from './pages/Login.jsx'
import { ResetPassword } from './pages/ResetPassword.jsx'
import { Signup } from './pages/Signup.jsx'
import { NotFound, SetupNeeded } from './pages/SimpleScreens.jsx'

// Signed-in pages load the first time someone opens them, so visitors to the
// landing page don't download the whole app. The router wraps each move in a
// transition, so the old page stays on screen while the next one loads.
const page = (load, name) => lazy(() => load().then((m) => ({ default: m[name] })))

const StudentHome = page(() => import('./pages/student/Home.jsx'), 'StudentHome')
const Profile = page(() => import('./pages/student/Profile.jsx'), 'Profile')
const Idea = page(() => import('./pages/student/Idea.jsx'), 'Idea')
const Progress = page(() => import('./pages/student/Progress.jsx'), 'Progress')
const Lessons = page(() => import('./pages/student/Lessons.jsx'), 'Lessons')
const StudentNotices = page(() => import('./pages/student/Notices.jsx'), 'StudentNotices')

const Overview = page(() => import('./pages/staff/Overview.jsx'), 'Overview')
const Students = page(() => import('./pages/staff/Students.jsx'), 'Students')
const Student = page(() => import('./pages/staff/Student.jsx'), 'Student')
const Reviews = page(() => import('./pages/staff/Reviews.jsx'), 'Reviews')
const StaffLessons = page(() => import('./pages/staff/Lessons.jsx'), 'StaffLessons')
const Meetings = page(() => import('./pages/staff/Meetings.jsx'), 'Meetings')
const StaffNotices = page(() => import('./pages/staff/Notices.jsx'), 'StaffNotices')
const StaffProfile = page(() => import('./pages/staff/Profile.jsx'), 'StaffProfile')

const Lists = page(() => import('./pages/admin/Lists.jsx'), 'Lists')
const Messages = page(() => import('./pages/Messages.jsx'), 'Messages')

export default function App() {
  if (!supabase) return <SetupNeeded />

  return (
    <AuthProvider>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route element={<SignedOutOnly />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Route>
          <Route path="/check-email" element={<CheckEmail />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<RequireRole roles={['student']} />}>
            <Route element={<AppShell menu={STUDENT_MENU} />}>
              <Route path="/student" element={<StudentHome />} />
              <Route path="/student/profile" element={<Profile />} />
              <Route path="/student/idea" element={<Idea />} />
              <Route path="/student/progress" element={<Progress />} />
              <Route path="/student/lessons" element={<Lessons />} />
              <Route path="/student/notices" element={<StudentNotices />} />
              <Route path="/student/messages" element={<Messages />} />
            </Route>
          </Route>

          <Route element={<RequireRole roles={['mentor', 'admin']} />}>
            <Route element={<StaffShell />}>
              <Route path="/staff" element={<Overview />} />
              <Route path="/staff/students" element={<Students />} />
              <Route path="/staff/students/:id" element={<Student />} />
              <Route path="/staff/reviews" element={<Reviews />} />
              <Route path="/staff/lessons" element={<StaffLessons />} />
              <Route path="/staff/meetings" element={<Meetings />} />
              <Route path="/staff/notices" element={<StaffNotices />} />
              <Route path="/staff/messages" element={<Messages />} />
              <Route path="/staff/profile" element={<StaffProfile />} />
            </Route>
          </Route>

          <Route element={<RequireRole roles={['admin']} />}>
            <Route element={<StaffShell />}>
              <Route path="/admin/people" element={<Navigate to="/staff/students?show=staff" replace />} />
              <Route path="/admin/lists" element={<Lists />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
