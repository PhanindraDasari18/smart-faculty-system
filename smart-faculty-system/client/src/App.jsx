import { useEffect, useState } from 'react'
import AdminLogin from './pages/AdminLogin.jsx'
import FacultyLogin from './pages/FacultyLogin.jsx'
import FacultyStatusUpdate from './pages/FacultyStatusUpdate.jsx'
import StudentFacultySearch from './pages/StudentFacultySearch.jsx'
import StudentLogin from './pages/StudentLogin.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import { getFaculty } from './services/facultyApi.js'

export default function App() {
  const [activePage, setActivePage] = useState('student')
  const [faculty, setFaculty] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [student, setStudent] = useState(null)
  const [facultyUser, setFacultyUser] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [authMode, setAuthMode] = useState('student')
  const isResetPage = window.location.pathname === '/reset-password'

  useEffect(() => {
    async function loadFaculty() {
      try {
        const facultyList = await getFaculty()
        setFaculty(facultyList)
        setError('')
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadFaculty()
    const refreshTimer = setInterval(loadFaculty, 10000)
    return () => clearInterval(refreshTimer)
  }, [])

  function handleFacultyUpdated(updatedFaculty) {
    setFaculty((current) => current.map((member) => (
      member._id === updatedFaculty._id ? updatedFaculty : member
    )))
  }

  function handleFacultyCreated(createdFaculty) {
    setFaculty((current) => [...current, createdFaculty].sort((first, second) => first.name.localeCompare(second.name)))
  }

  async function handleTimetableImported() {
    const facultyList = await getFaculty()
    setFaculty(facultyList)
    return facultyList
  }

  function handleStudentLogin(studentInfo) {
    setStudent(studentInfo)
    setFacultyUser(null)
    setAdminUser(null)
    setActivePage('student')
  }

  function handleFacultyLogin(facultyInfo) {
    setFacultyUser(facultyInfo)
    setStudent(null)
    setAdminUser(null)
    setActivePage('faculty')
    setAuthMode('faculty')
  }

  function handleAdminLogin(adminInfo) {
    setAdminUser(adminInfo)
    setStudent(null)
    setFacultyUser(null)
    setActivePage('faculty')
    setAuthMode('admin')
  }

  function handleBackToLogin() {
    setAuthMode(facultyUser ? 'faculty' : adminUser ? 'admin' : 'student')
    setStudent(null)
    setFacultyUser(null)
    setAdminUser(null)
    setActivePage('student')
  }

  if (!student && !facultyUser && !adminUser) {
    return (
      <main className="app-shell">
        <header className="site-header">
          <div className="brand-mark">SF</div>
          <div>
            <p className="brand-kicker">Campus pulse</p>
            <h1>Smart Faculty Availability</h1>
          </div>
        </header>

        <div className="hero-strip">
          <span className="live-indicator" />
          <span>Choose your access</span>
          <span className="hero-count">{faculty.length} faculty listed</span>
        </div>

        <nav className="page-nav" aria-label="Authentication mode">
          <button className={authMode === 'student' ? 'nav-link nav-link--active' : 'nav-link'} onClick={() => setAuthMode('student')}>Student</button>
          <button className={authMode === 'faculty' ? 'nav-link nav-link--active' : 'nav-link'} onClick={() => setAuthMode('faculty')}>Faculty</button>
          <button className={authMode === 'admin' ? 'nav-link nav-link--active' : 'nav-link'} onClick={() => setAuthMode('admin')}>Admin</button>
        </nav>

        {isResetPage ? <ResetPassword /> : <>
          {authMode === 'student' && <StudentLogin onLogin={handleStudentLogin} />}
          {authMode === 'faculty' && <FacultyLogin onLogin={handleFacultyLogin} />}
          {authMode === 'admin' && <AdminLogin onLogin={handleAdminLogin} />}
        </>}
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="brand-mark">SF</div>
        <div>
          <p className="brand-kicker">Campus pulse</p>
          <h1>Smart Faculty Availability</h1>
        </div>
      </header>

      <div className="hero-strip">
        <span className="live-indicator" />
        <span>Faculty availability, at a glance</span>
        <span className="hero-count">{faculty.length} faculty listed</span>
      </div>

      <nav className="page-nav" aria-label="Main navigation">
        {!adminUser && !facultyUser && <button className={activePage === 'student' ? 'nav-link nav-link--active' : 'nav-link'} onClick={() => { setActivePage('student'); setFacultyUser(null); setAdminUser(null); setStudent(null) }}>Student search</button>}
        <button className="nav-link" onClick={handleBackToLogin}>Back</button>
      </nav>

      {adminUser ? (
        <FacultyStatusUpdate faculty={faculty} facultyUser={facultyUser} adminUser={adminUser} onFacultyUpdated={handleFacultyUpdated} onFacultyCreated={handleFacultyCreated} onTimetableImported={handleTimetableImported} />
      ) : student ? (
        activePage === 'student' ? (
          <StudentFacultySearch faculty={faculty} loading={loading} error={error} student={student} />
        ) : (
          <FacultyStatusUpdate faculty={faculty} facultyUser={facultyUser} adminUser={adminUser} onFacultyUpdated={handleFacultyUpdated} onFacultyCreated={handleFacultyCreated} onTimetableImported={handleTimetableImported} />
        )
      ) : (
        <FacultyStatusUpdate faculty={faculty} facultyUser={facultyUser} adminUser={adminUser} onFacultyUpdated={handleFacultyUpdated} onFacultyCreated={handleFacultyCreated} onTimetableImported={handleTimetableImported} />
      )}
    </main>
  )
}
