import { Router } from 'express'
import {
  createFaculty,
  clearMyAvailability,
  downloadTimetableImport,
  exportCurrentTimetable,
  getFaculty,
  getFacultyById,
  getTimetableImportHistory,
  importTimetable,
  loginAdmin,
  loginFaculty,
  registerAdmin,
  registerFaculty,
  updateLocation,
  updateMyTimetable,
  updateReason,
  updateStatus,
  updateTimetable
} from '../controllers/facultyController.js'
import { requireFaculty } from '../middleware/facultyAuth.js'
import { requestPasswordReset, resetPassword } from '../controllers/passwordResetController.js'

const router = Router()

router.get('/', getFaculty)
router.get('/search', getFaculty)
router.get('/timetable/imports', getTimetableImportHistory)
router.get('/timetable/imports/:importId/download', downloadTimetableImport)
router.get('/timetable/export.xlsx', exportCurrentTimetable)
router.post('/timetable/import', importTimetable)
router.put('/me/timetable', requireFaculty, updateMyTimetable)
router.delete('/me/availability', requireFaculty, clearMyAvailability)
router.get('/:id', getFacultyById)
router.post('/register', registerFaculty)
router.post('/login', loginFaculty)
router.post('/forgot-password', requestPasswordReset)
router.post('/reset-password', resetPassword)
router.post('/admin/register', registerAdmin)
router.post('/admin/login', loginAdmin)
router.post('/', createFaculty)
router.put('/:id/status', updateStatus)
router.put('/:id/location', updateLocation)
router.put('/:id/reason', updateReason)
router.put('/:id/timetable', requireFaculty, updateTimetable)

export default router
