import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema(
  {
    rollNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    passwordResetToken: { type: String, default: undefined, select: false },
    passwordResetExpires: { type: Date, default: undefined, select: false },
    batch: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    year: {
      type: Number,
      required: true
    },
    department: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    studentNumber: {
      type: Number,
      required: true
    }
  },
  { timestamps: { createdAt: false, updatedAt: true } }
)

export function parseRollNo(rollNo) {
  if (!rollNo) return null

  const normalized = String(rollNo).trim().toUpperCase()
  const match = normalized.match(/^([A-Z])(\d{2})([A-Z]{2})(\d{3})$/)

  if (!match) return null

  const [, batch, year, department, studentNumber] = match

  return {
    rollNo: normalized,
    batch,
    year: Number(year),
    department,
    studentNumber: Number(studentNumber)
  }
}

studentSchema.pre('validate', function validateStudent(next) {
  const parsed = parseRollNo(this.rollNo)

  if (!parsed) {
    next(new Error('Roll number must be in format B24CS269'))
    return
  }

  this.rollNo = parsed.rollNo
  this.batch = parsed.batch
  this.year = parsed.year
  this.department = parsed.department
  this.studentNumber = parsed.studentNumber

  next()
})

export default mongoose.model('Student', studentSchema)
