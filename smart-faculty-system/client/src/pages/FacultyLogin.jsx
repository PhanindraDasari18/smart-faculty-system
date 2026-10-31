import { useState } from 'react'
import { loginFaculty, registerFaculty, requestPasswordReset } from '../services/facultyApi.js'

export default function FacultyLogin({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [facultyId, setFacultyId] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [forgot, setForgot] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanedFacultyId = facultyId.trim()

    if (!cleanedFacultyId) {
      setError('Faculty ID is required')
      return
    }

    if (!password.trim() || password.trim().length < 4) {
      setError('Password must be at least 4 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const request = mode === 'register' ? registerFaculty : loginFaculty
      const response = await request({
        facultyId: cleanedFacultyId,
        password: password.trim(),
        email
      })

      onLogin(response)
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
      const result = await requestPasswordReset('faculty', facultyId)
      setError(result.message)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page-section login-section">
      <div className="login-panel">
        <h2>{forgot ? 'Reset faculty password' : mode === 'login' ? 'Faculty login' : 'Create faculty account'}</h2>
        <p className="section-description">{forgot ? 'We will email a reset link to the address registered with this faculty ID.' : 'Use your faculty ID and password to update your availability.'}</p>

        {!forgot && <div className="toggle-group" aria-label="Faculty authentication mode">
          <button
            type="button"
            className={mode === 'login' ? 'toggle-button toggle-button--active' : 'toggle-button'}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'toggle-button toggle-button--active' : 'toggle-button'}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>}

        <form className="login-form" onSubmit={forgot ? handleForgot : handleSubmit}>
          {!forgot && mode === 'register' && <label>
            Email address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required />
          </label>}

          <label>
            Faculty ID
            <input
              type="text"
              value={facultyId}
              onChange={(event) => setFacultyId(event.target.value)}
              placeholder="FAC-CSE-011"
              required
            />
          </label>

          {!forgot && <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Please wait...' : forgot ? 'Send reset link' : mode === 'login' ? 'Login' : 'Register'}
          </button>

          {error && <p className={error.startsWith('If the account') ? 'success-message' : 'message message--error'}>{error}</p>}
        </form>
        {mode === 'login' && <button type="button" className="text-action" onClick={() => { setForgot(!forgot); setError('') }}>{forgot ? 'Back to login' : 'Forgot password?'}</button>}
      </div>
    </section>
  )
}
