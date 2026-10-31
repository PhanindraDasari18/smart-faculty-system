import { Router } from 'express'
import { loginStudent, registerStudent } from '../controllers/studentController.js'
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController.js'

const router = Router()

router.post('/register', registerStudent)
router.post('/login', loginStudent)
router.post('/forgot-password', requestPasswordReset)
router.post('/reset-password', resetPassword)

export default router
