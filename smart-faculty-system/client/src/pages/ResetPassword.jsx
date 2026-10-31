import { useState } from 'react'
import { resetPassword } from '../services/facultyApi.js'

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token') || ''
  const type = params.get('type') || ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (password.length < 4) return setMessage('Password must be at least 4 characters.')
    if (password !== confirmation) return setMessage('Passwords do not match.')
    setLoading(true)
    setMessage('')
    try {
      const result = await resetPassword(type, token, password)
      setMessage(result.message)
      setSuccess(true)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const validLink = token && ['student', 'faculty'].includes(type)

  return (
    <section className="page-section">
      <div className="login-panel">
        <h2>Choose a new password</h2>
        <p className="section-description">Reset links expire after 30 minutes and can only be used once.</p>
        {validLink && !success ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <label>New password<input type="password" minLength="4" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <label>Confirm new password<input type="password" minLength="4" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></label>
            {message && <p className="message message--error">{message}</p>}
            <button className="login-button" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Reset password'}</button>
          </form>
        ) : (
          <>
            {message && <p className={success ? 'success-message' : 'message message--error'}>{message}</p>}
            {!success && !validLink && <p className="message message--error">This reset link is incomplete. Request a new password reset.</p>}
            <a className="text-action" href="/">Return to login</a>
          </>
        )}
      </div>
    </section>
  )
}
