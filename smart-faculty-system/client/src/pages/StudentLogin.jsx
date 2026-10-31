import { useState } from 'react'
import { loginStudent, registerStudent, requestPasswordReset } from '../services/facultyApi.js'

export default function StudentLogin({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [rollNo, setRollNo] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [forgot, setForgot] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function normalizeRollNo(value) {
    return value.trim().toUpperCase()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const cleanedRollNo = normalizeRollNo(rollNo)

    if (!/^([A-Z])(\d{2})([A-Z]{2})(\d{3})$/.test(cleanedRollNo)) {
      setError('Roll number must be in format B24CS269')
      return
    }

    if (!password.trim() || password.trim().length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const request = mode === 'register' ? registerStudent : loginStudent
      const response = await request({ rollNo: cleanedRollNo, password: password.trim(), email })

      onLogin({
        studentName: response.rollNo,
        studentId: response.rollNo,
        rollNo: response.rollNo,
        batch: response.batch,
        year: response.year,
        department: response.department
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await requestPasswordReset('student', normalizeRollNo(rollNo))
      setError(result.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-section">
      <div className="login-panel">
        <p className="eyebrow">Student access</p>
        <h2>{forgot ? 'Reset student password' : mode === 'login' ? 'Student login' : 'Create student account'}</h2>
        <p className="section-description">{forgot ? 'We will email a reset link to the address registered with this roll number.' : 'Use your roll number and password to access faculty details.'}</p>

        {!forgot && <div className="auth-toggle">
          <button type="button" className={mode === 'login' ? 'toggle-button toggle-button--active' : 'toggle-button'} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'register' ? 'toggle-button toggle-button--active' : 'toggle-button'} onClick={() => setMode('register')}>
            Register
          </button>
        </div>}

        <form className="login-form" onSubmit={forgot ? handleForgot : handleSubmit}>
          {!forgot && mode === 'register' && <label>
            Email address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>}

          <label>
            Roll number
            <input
              value={rollNo}
              onChange={(event) => setRollNo(event.target.value)}
              placeholder="B24CS269"
              autoCapitalize="characters"
            />
          </label>

          {!forgot && <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </label>}

          {error && <p className={error.startsWith('If the account') ? 'success-message' : 'message message--error'}>{error}</p>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Please wait...' : forgot ? 'Send reset link' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
        {mode === 'login' && <button type="button" className="text-action" onClick={() => { setForgot(!forgot); setError('') }}>{forgot ? 'Back to login' : 'Forgot password?'}</button>}
      </div>
    </section>
  )
}
