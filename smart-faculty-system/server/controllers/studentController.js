import Student, { parseRollNo } from '../models/Student.js'

export async function registerStudent(request, response) {
  try {
    const { rollNo, password, email } = request.body || {}
    const parsed = parseRollNo(rollNo)

    if (!parsed) {
      return response.status(400).json({ message: 'Roll number must be in format B24CS269' })
    }

    if (!password || String(password).trim().length < 4) {
      return response.status(400).json({ message: 'Password must be at least 4 characters long' })
    }

    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return response.status(400).json({ message: 'A valid email address is required' })
    }

    const existingStudent = await Student.findOne({ rollNo: parsed.rollNo })
    if (existingStudent) {
      return response.status(409).json({ message: 'Student already exists' })
    }

    const student = await Student.create({
      rollNo: parsed.rollNo,
      password: String(password).trim(),
      email: normalizedEmail,
      batch: parsed.batch,
      year: parsed.year,
      department: parsed.department,
      studentNumber: parsed.studentNumber
    })

    return response.status(201).json({
      _id: student._id,
      rollNo: student.rollNo,
      batch: student.batch,
      year: student.year,
      department: student.department
    })
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: 'Student already exists' })
    }

    return response.status(500).json({ message: 'Server error' })
  }
}

export async function loginStudent(request, response) {
  try {
    const { rollNo, password } = request.body || {}
    const parsed = parseRollNo(rollNo)

    if (!parsed) {
      return response.status(400).json({ message: 'Roll number must be in format B24CS269' })
    }

    if (!password || String(password).trim().length < 4) {
      return response.status(400).json({ message: 'Password is required' })
    }

    const student = await Student.findOne({
      rollNo: parsed.rollNo,
      password: String(password).trim()
    })

    if (!student) {
      return response.status(401).json({ message: 'Invalid roll number or password' })
    }

    return response.json({
      _id: student._id,
      rollNo: student.rollNo,
      batch: student.batch,
      year: student.year,
      department: student.department
    })
  } catch (error) {
    return response.status(500).json({ message: 'Server error' })
  }
}
