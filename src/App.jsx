import { Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { Home, RequireRole, SignedOutOnly } from './auth/guards.jsx'
import { AppShell, StaffShell } from './components/layouts.jsx'
import { STUDENT_MENU } from './lib/menus.js'
import { supabase } from './lib/supabase.js'
import { Lists } from './pages/admin/Lists.jsx'
import { People } from './pages/admin/People.jsx'
import { AuthCallback } from './pages/AuthCallback.jsx'
import { CheckEmail } from './pages/CheckEmail.jsx'
import { ForgotPassword } from './pages/ForgotPassword.jsx'
import { Login } from './pages/Login.jsx'
import { ResetPassword } from './pages/ResetPassword.jsx'
import { Signup } from './pages/Signup.jsx'
import { NotFound, SetupNeeded } from './pages/SimpleScreens.jsx'
import { StaffLessons } from './pages/staff/Lessons.jsx'
import { Meetings } from './pages/staff/Meetings.jsx'
import { StaffNotices } from './pages/staff/Notices.jsx'
import { Overview } from './pages/staff/Overview.jsx'
import { Reviews } from './pages/staff/Reviews.jsx'
import { Student } from './pages/staff/Student.jsx'
import { Students } from './pages/staff/Students.jsx'
import { StudentHome } from './pages/student/Home.jsx'
import { Idea } from './pages/student/Idea.jsx'
import { Lessons } from './pages/student/Lessons.jsx'
import { StudentNotices } from './pages/student/Notices.jsx'
import { Profile } from './pages/student/Profile.jsx'
import { Progress } from './pages/student/Progress.jsx'

export default function App() {
  if (!supabase) return <SetupNeeded />

  return (
    <AuthProvider>
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
          </Route>
        </Route>

        <Route element={<RequireRole roles={['admin']} />}>
          <Route element={<StaffShell />}>
            <Route path="/admin/people" element={<People />} />
            <Route path="/admin/lists" element={<Lists />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
