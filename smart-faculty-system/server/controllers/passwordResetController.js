import { randomBytes, createHash } from 'node:crypto'
import nodemailer from 'nodemailer'
import Student from '../models/Student.js'
import Faculty from '../models/Faculty.js'
import { parseRollNo } from '../models/Student.js'

const accountTypes = {
  student: { Model: Student, idField: 'rollNo' },
  faculty: { Model: Faculty, idField: 'facultyId' }
}

function normalizeId(type, value) {
  const id = String(value || '').trim()
  if (type === 'student') return parseRollNo(id)?.rollNo || null
  return id ? id.toUpperCase() : null
}

export async function requestPasswordReset(request, response) {
  try {
    const type = String(request.body?.type || '').toLowerCase()
    const accountType = accountTypes[type]
    const id = normalizeId(type, request.body?.id)
    if (!accountType || !id) return response.status(400).json({ message: 'Enter a valid account ID' })
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
    const smtpPort = Number(process.env.SMTP_PORT || 465)
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS?.replace(/\s/g, '')
    const sender = process.env.EMAIL_FROM || smtpUser
    if (!smtpUser || !smtpPass || !sender) {
      throw new Error('SMTP_USER, SMTP_PASS, and EMAIL_FROM must be configured')
    }

    const account = await accountType.Model.findOne({ [accountType.idField]: id })
    if (account?.email) {
      const token = randomBytes(32).toString('hex')
      account.passwordResetToken = createHash('sha256').update(token).digest('hex')
      account.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000)
      await account.save()

      const resetUrl = new URL('/reset-password', process.env.CLIENT_URL || 'http://localhost:5173')
      resetUrl.searchParams.set('token', token)
      resetUrl.searchParams.set('type', type)
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      })
      await transporter.sendMail({
        from: sender,
        to: account.email,
        subject: 'Reset your Smart Faculty System password',
        text: `Use this link to reset your password. It expires in 30 minutes:\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`
      })
    }

    return response.json({ message: 'If the account has a registered email, a reset link has been sent.' })
  } catch (error) {
    console.error('Password reset email could not be sent:', error.message)
    return response.status(500).json({ message: 'Unable to send reset email. Check the Gmail SMTP configuration and server logs.' })
  }
}

export async function resetPassword(request, response) {
  try {
    const type = String(request.body?.type || '').toLowerCase()
    const accountType = accountTypes[type]
    const { token, password } = request.body || {}
    if (!accountType || !token || !password || String(password).trim().length < 4) {
      return response.status(400).json({ message: 'A valid reset link and password of at least 4 characters are required' })
    }

    const hashedToken = createHash('sha256').update(String(token)).digest('hex')
    const account = await accountType.Model.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires')

    if (!account) return response.status(400).json({ message: 'This reset link is invalid or expired. Request a new one.' })

    account.password = String(password).trim()
    account.passwordResetToken = undefined
    account.passwordResetExpires = undefined
    await account.save()
    return response.json({ message: 'Password reset successful. You can now sign in.' })
  } catch (error) {
    console.error('Password reset failed:', error.message)
    return response.status(500).json({ message: 'Unable to reset password' })
  }
}
