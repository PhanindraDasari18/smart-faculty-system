import Admin from '../models/Admin.js'
import Faculty, { statuses } from '../models/Faculty.js'
import TimetableImport from '../models/TimetableImport.js'
import { createFacultyToken } from '../middleware/facultyAuth.js'
import { getBranchCode } from '../branchCode.js'
import XLSX from 'xlsx'

function normalizeFacultyId(facultyId) {
  if (!facultyId) return null
  return String(facultyId).trim().toUpperCase()
}

function handleControllerError(error, response) {
  if (error.code === 11000) {
    return response.status(409).json({ message: 'facultyId already exists' })
  }

  if (error.name === 'ValidationError') {
    return response.status(400).json({ message: error.message })
  }

  return response.status(500).json({ message: 'Server error' })
}

export async function registerFaculty(request, response) {
  try {
    const { facultyId, password, email } = request.body || {}
    const normalizedFacultyId = normalizeFacultyId(facultyId)

    if (!normalizedFacultyId) {
      return response.status(400).json({ message: 'Faculty ID is required' })
    }

    if (!password || String(password).trim().length < 4) {
      return response.status(400).json({ message: 'Password must be at least 4 characters long' })
    }

    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return response.status(400).json({ message: 'A valid email address is required' })
    }

    const existingFaculty = await Faculty.findOne({ facultyId: normalizedFacultyId })
    if (existingFaculty) {
      return response.status(409).json({ message: 'Faculty already exists' })
    }

    const faculty = await Faculty.create({
      facultyId: normalizedFacultyId,
      password: String(password).trim(),
      email: normalizedEmail,
      name: normalizedFacultyId,
      department: 'CSE',
      phone: '',
      designation: 'Faculty'
    })

    return response.status(201).json({
      _id: faculty._id,
      facultyId: faculty.facultyId,
      name: faculty.name,
      department: faculty.department,
      role: 'faculty',
      token: createFacultyToken(faculty.facultyId)
    })
  } catch (error) {
    return handleControllerError(error, response)
  }
}

export async function loginFaculty(request, response) {
  try {
    const { facultyId, password } = request.body || {}
    const normalizedFacultyId = normalizeFacultyId(facultyId)

    if (!normalizedFacultyId) {
      return response.status(400).json({ message: 'Faculty ID is required' })
    }

    if (!password || String(password).trim().length < 4) {
      return response.status(400).json({ message: 'Password is required' })
    }

    const faculty = await Faculty.findOne({
      facultyId: normalizedFacultyId,
      password: String(password).trim()
    })

    if (!faculty) {
      return response.status(401).json({ message: 'Invalid faculty ID or password' })
    }

    return response.json({
      _id: faculty._id,
      facultyId: faculty.facultyId,
      name: faculty.name,
      department: faculty.department,
      role: 'faculty',
      token: createFacultyToken(faculty.facultyId)
    })
  } catch (error) {
    return handleControllerError(error, response)
  }
}

export async function registerAdmin(request, response) {
  try {
    const { username, password } = request.body || {}
    const normalizedUsername = String(username || '').trim().toLowerCase()

    if (!normalizedUsername) {
      return response.status(400).json({ message: 'Username is required' })
    }

    if (!password || String(password).trim().length < 4) {
      return response.status(400).json({ message: 'Password must be at least 4 characters long' })
    }

    const existingAdmin = await Admin.findOne({ username: normalizedUsername })
    if (existingAdmin) {
      return response.status(409).json({ message: 'Admin already exists' })
    }

    const admin = await Admin.create({
      username: normalizedUsername,
      password: String(password).trim()
    })

    return response.status(201).json({
      _id: admin._id,
      username: admin.username,
      role: 'admin'
    })
  } catch (error) {
    return handleControllerError(error, response)
  }
}

export async function loginAdmin(request, response) {
  try {
    const { username, password } = request.body || {}
    const normalizedUsername = String(username || '').trim().toLowerCase()

    if (!normalizedUsername) {
      return response.status(400).json({ message: 'Username is required' })
    }

    if (!password || String(password).trim().length < 4) {
      return response.status(400).json({ message: 'Password is required' })
    }

    const admin = await Admin.findOne({
      username: normalizedUsername,
      password: String(password).trim()
    })

    if (!admin) {
      return response.status(401).json({ message: 'Invalid admin username or password' })
    }

    return response.json({
      _id: admin._id,
      username: admin.username,
      role: 'admin'
    })
  } catch (error) {
    return handleControllerError(error, response)
  }
}

export async function getFaculty(request, response) {
  try {
    const faculty = (await Faculty.find()).sort((first, second) =>
      first.facultyId.localeCompare(second.facultyId, undefined, { numeric: true, sensitivity: 'base' })
    )
    return response.json(faculty)
  } catch (error) {
    return handleControllerError(error, response)
  }
}

export async function getFacultyById(request, response) {
  try {
    const faculty = await Faculty.findById(request.params.id)

    if (!faculty) {
      return response.status(404).json({ message: 'Faculty member not found' })
    }

    response.json(faculty)
  } catch (error) {
    handleControllerError(error, response)
  }
}

export async function createFaculty(request, response) {
  try {
    const faculty = await Faculty.create({
      ...request.body,
      facultyCode: getBranchCode(request.body.currentDepartment || request.body.department)
    })
    response.status(201).json(faculty)
  } catch (error) {
    handleControllerError(error, response)
  }
}

async function updateFacultyField(request, response, field) {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      request.params.id,
      { [field]: request.body[field] },
      { new: true, runValidators: true }
    )

    if (!faculty) {
      return response.status(404).json({ message: 'Faculty member not found' })
    }

    response.json(faculty)
  } catch (error) {
    handleControllerError(error, response)
  }
}

export function updateStatus(request, response) {
  if (!statuses.includes(request.body.currentStatus)) {
    return response.status(400).json({ message: 'Invalid faculty status' })
  }

  const { availabilityDate, availabilityStartTime, availabilityEndTime } = request.body
  if (!availabilityDate || !availabilityStartTime || !availabilityEndTime) {
    return response.status(400).json({ message: 'Date, start time, and end time are required' })
  }

  if (availabilityStartTime >= availabilityEndTime) {
    return response.status(400).json({ message: 'End time must be after start time' })
  }

  return Faculty.findByIdAndUpdate(
    request.params.id,
    {
      currentStatus: request.body.currentStatus,
      availabilityDate,
      availabilityTimeSlot: `${availabilityStartTime} - ${availabilityEndTime}`,
      availabilityStartTime,
      availabilityEndTime
    },
    { new: true, runValidators: true }
  )
    .then((faculty) => {
      if (!faculty) return response.status(404).json({ message: 'Faculty member not found' })
      return response.json(faculty)
    })
    .catch((error) => handleControllerError(error, response))
}

export async function clearMyAvailability(request, response) {
  try {
    const faculty = await Faculty.findOneAndUpdate(
      { facultyId: request.auth.facultyId },
      {
        $set: {
          currentStatus: 'Available',
          availabilityDate: '',
          availabilityTimeSlot: '',
          availabilityStartTime: '',
          availabilityEndTime: '',
          reason: ''
        }
      },
      { new: true, runValidators: true }
    ).select('-password')

    if (!faculty) return response.status(404).json({ message: 'Faculty member not found' })
    return response.json(faculty)
  } catch (error) {
    return handleControllerError(error, response)
  }
}

export function updateLocation(request, response) {
  return updateFacultyField(request, response, 'currentLocation')
}

export function updateReason(request, response) {
  return updateFacultyField(request, response, 'reason')
}

export function updateTimetable(request, response) {
  const { timetable } = request.body || {}

  if (!Array.isArray(timetable)) {
    return response.status(400).json({ message: 'Timetable must be an array' })
  }

  return Faculty.findOneAndUpdate(
    { _id: request.params.id, facultyId: request.auth.facultyId },
    { timetable: normalizeTimetableEntries(timetable) },
    { new: true, runValidators: true }
  ).select('-password')
    .then((faculty) => {
      if (!faculty) return response.status(404).json({ message: 'Faculty member not found' })
      return response.json(faculty)
    })
    .catch((error) => handleControllerError(error, response))
}

const timetableColumns = ['facultyId', 'day', 'slot', 'subject', 'semester', 'section', 'block', 'sharedFaculty', 'room']
const weekdays = new Set(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function cellText(value) {
  return String(value ?? '').trim()
}

function normalizeTimetableEntries(timetable) {
  return timetable.map((entry) => ({
    ...entry,
    block: cellText(entry.block || entry.teachingBlock || entry['Teaching Block'])
  }))
}

function scheduleMinutes(hour, minute) {
  const parsedHour = Number(hour)
  const normalizedHour = parsedHour >= 1 && parsedHour <= 4 ? parsedHour + 12 : parsedHour
  return normalizedHour * 60 + Number(minute)
}

function compareSections(first, second) {
  const parseSection = (section) => String(section || '').toUpperCase().replaceAll(' ', '').match(/^(\d+)([A-Z]+)(\d+)$/)
  const firstParts = parseSection(first)
  const secondParts = parseSection(second)
  if (firstParts && secondParts) {
    return Number(firstParts[1]) - Number(secondParts[1]) ||
      firstParts[2].localeCompare(secondParts[2]) ||
      Number(firstParts[3]) - Number(secondParts[3])
  }
  return String(first || '').localeCompare(String(second || ''), undefined, { numeric: true, sensitivity: 'base' })
}

function slotStart(slot) {
  const match = String(slot || '').match(/^(\d{1,2}):(\d{2})/)
  return match ? scheduleMinutes(match[1], match[2]) : 0
}

function compareTimetableEntries(first, second) {
  const firstDay = weekdayOrder.indexOf(first.day)
  const secondDay = weekdayOrder.indexOf(second.day)
  return firstDay - secondDay || compareSections(first.section, second.section) || slotStart(first.slot) - slotStart(second.slot) ||
    first.subject.localeCompare(second.subject, undefined, { numeric: true, sensitivity: 'base' })
}

function compareImportRows(first, second) {
  return first.facultyId.localeCompare(second.facultyId, undefined, { numeric: true, sensitivity: 'base' }) ||
    weekdayOrder.indexOf(first.day) - weekdayOrder.indexOf(second.day) ||
    compareSections(first.section, second.section) || slotStart(first.slot) - slotStart(second.slot)
}

export async function importTimetable(request, response) {
  try {
    const { fileBase64, fileName } = request.body || {}
    if (typeof fileBase64 !== 'string' || !fileBase64 || typeof fileName !== 'string' || !fileName.trim()) {
      return response.status(400).json({ message: 'Upload an Excel workbook to import.' })
    }

    const sourceFileData = Buffer.from(fileBase64, 'base64')
    const workbook = XLSX.read(sourceFileData, { type: 'buffer', cellDates: false })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) return response.status(400).json({ message: 'The workbook has no sheets.' })

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '', raw: false })
    if (!rows.length) return response.status(400).json({ message: 'The first sheet has no timetable rows.' })

    const headerMap = new Map(Object.keys(rows[0]).map((header) => [header.trim().toLowerCase(), header]))
    const blockHeader = [...headerMap.entries()].find(([normalizedHeader]) =>
      ['block', 'teachingblock'].includes(normalizedHeader.replace(/[\s_-]/g, ''))
    )?.[1]
    if (blockHeader) headerMap.set('block', blockHeader)
    const missingColumns = timetableColumns.filter((column) => !headerMap.has(column.toLowerCase()))
    if (missingColumns.length) {
      return response.status(400).json({ message: `Missing columns: ${missingColumns.join(', ')}` })
    }

    const entriesByFaculty = new Map()
    const importedSemesters = new Set()
    const rowErrors = []

    rows.forEach((row, index) => {
      const value = (column) => cellText(row[headerMap.get(column.toLowerCase())])
      const entry = {
        facultyId: value('facultyId').toUpperCase(),
        day: value('day').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase()),
        slot: value('slot'),
        subject: value('subject'),
        semester: value('semester').toUpperCase(),
        section: value('section').toUpperCase(),
        block: value('block'),
        sharedFaculty: value('sharedFaculty'),
        room: value('room')
      }
      const missingValues = ['facultyId', 'day', 'slot', 'subject', 'semester', 'section']
        .filter((field) => !entry[field])

      if (entry.day && !weekdays.has(entry.day.toLowerCase())) {
        rowErrors.push(`Row ${index + 2}: day must be a weekday name, for example Monday`)
      }
      const timeMatch = entry.slot.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/)
      const timePartsValid = timeMatch && Number(timeMatch[1]) <= 23 && Number(timeMatch[3]) <= 23 && Number(timeMatch[2]) <= 59 && Number(timeMatch[4]) <= 59
      if (entry.slot && !timePartsValid) {
        rowErrors.push(`Row ${index + 2}: slot must use HH:mm - HH:mm, for example 09:30 - 10:30`)
      } else if (timeMatch) {
        const startMinutes = scheduleMinutes(timeMatch[1], timeMatch[2])
        const endMinutes = scheduleMinutes(timeMatch[3], timeMatch[4])
        if (startMinutes >= endMinutes) rowErrors.push(`Row ${index + 2}: slot end time must be after start time`)
        entry.slot = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]} - ${timeMatch[3].padStart(2, '0')}:${timeMatch[4]}`
      }

      const invalidTimeRange = !timePartsValid || (timeMatch && scheduleMinutes(timeMatch[1], timeMatch[2]) >= scheduleMinutes(timeMatch[3], timeMatch[4]))
      if (missingValues.length || (entry.day && !weekdays.has(entry.day.toLowerCase())) || invalidTimeRange) return

      importedSemesters.add(entry.semester)
      const { facultyId, ...timetableEntry } = entry
      if (!entriesByFaculty.has(facultyId)) entriesByFaculty.set(facultyId, [])
      entriesByFaculty.get(facultyId).push(timetableEntry)
    })

    if (rowErrors.length) {
      return response.status(400).json({ message: 'Fix the following Excel rows and upload again.', errors: rowErrors.slice(0, 20) })
    }

    const facultyMembers = await Faculty.find()
    const facultyById = new Map(facultyMembers.map((member) => [member.facultyId.toUpperCase(), member]))
    const unknownIds = [...entriesByFaculty.keys()].filter((facultyId) => !facultyById.has(facultyId))
    if (unknownIds.length) {
      return response.status(400).json({ message: `These faculty IDs were not found: ${unknownIds.join(', ')}` })
    }

    for (const importedEntries of entriesByFaculty.values()) importedEntries.sort(compareTimetableEntries)
    const sortedRows = [...entriesByFaculty.entries()]
      .flatMap(([facultyId, entries]) => entries.map((entry) => ({ facultyId, ...entry })))
      .sort(compareImportRows)
    const sortedSheet = XLSX.utils.json_to_sheet(sortedRows, { header: timetableColumns })
    sortedSheet['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 24 }, { wch: 22 }]
    const sortedWorkbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(sortedWorkbook, sortedSheet, 'Faculty Timetable')
    const sortedFileData = XLSX.write(sortedWorkbook, { type: 'buffer', bookType: 'xlsx' })
    const sortedFileName = fileName.trim().replace(/\.(xlsx|xls)$/i, '.xlsx').slice(0, 200)

    const operations = facultyMembers.map((member) => {
      const importedEntries = entriesByFaculty.get(member.facultyId.toUpperCase()) || []
      const keptEntries = member.timetable.filter((entry) => !importedSemesters.has(entry.semester))
      return {
        updateOne: {
          filter: { _id: member._id },
          update: { $set: { timetable: [...keptEntries, ...importedEntries] } }
        }
      }
    })

    await Faculty.bulkWrite(operations)
    const savedImport = await TimetableImport.create({
      fileName: sortedFileName,
      fileData: sortedFileData,
      rowsImported: rows.length,
      facultyWithImportedRows: entriesByFaculty.size,
      semestersReplaced: [...importedSemesters]
    })
    return response.json({
      message: 'Timetable imported successfully.',
      rowsImported: rows.length,
      facultyUpdated: facultyMembers.length,
      facultyWithImportedRows: entriesByFaculty.size,
      semestersReplaced: [...importedSemesters],
      importId: savedImport._id,
      uploadedAt: savedImport.createdAt
    })
  } catch (error) {
    if (error.name === 'ValidationError') return response.status(400).json({ message: error.message })
    return response.status(400).json({ message: 'Could not read the Excel workbook. Save it as .xlsx and try again.' })
  }
}

export async function getTimetableImportHistory(request, response) {
  try {
    const imports = await TimetableImport.find()
      .select('-fileData')
      .sort({ createdAt: -1 })
    return response.json(imports)
  } catch (error) {
    return response.status(500).json({ message: 'Unable to load timetable import history.' })
  }
}

export async function downloadTimetableImport(request, response) {
  try {
    const savedImport = await TimetableImport.findById(request.params.importId)
    if (!savedImport) return response.status(404).json({ message: 'Saved Excel file not found.' })

    const safeFileName = savedImport.fileName.replace(/[^\w.-]/g, '_')
    const fileType = safeFileName.toLowerCase().endsWith('.xls')
      ? 'application/vnd.ms-excel'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    response.setHeader('Content-Type', fileType)
    response.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`)
    return response.send(savedImport.fileData)
  } catch (error) {
    return response.status(400).json({ message: 'Unable to download the saved Excel file.' })
  }
}

export async function updateMyTimetable(request, response) {
  const { timetable } = request.body || {}
  if (!Array.isArray(timetable)) {
    return response.status(400).json({ message: 'Timetable must be an array.' })
  }

  try {
    const faculty = await Faculty.findOneAndUpdate(
      { facultyId: request.auth.facultyId },
      { $set: { timetable: normalizeTimetableEntries(timetable).sort(compareTimetableEntries) } },
      { new: true, runValidators: true }
    ).select('-password')

    if (!faculty) return response.status(404).json({ message: 'Faculty profile not found.' })
    return response.json(faculty)
  } catch (error) {
    return handleControllerError(error, response)
  }
}

export async function exportCurrentTimetable(request, response) {
  try {
    const facultyMembers = await Faculty.find()
    const rows = facultyMembers.flatMap((member) => member.timetable.map((entry) => ({
      facultyId: member.facultyId,
      day: entry.day,
      slot: entry.slot,
      subject: entry.subject,
      semester: entry.semester,
      section: entry.section,
      block: entry.block,
      sharedFaculty: entry.sharedFaculty,
      room: entry.room
    }))).sort(compareImportRows)
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: timetableColumns })
    const exportedWorkbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(exportedWorkbook, worksheet, 'Faculty Timetable')
    const fileData = XLSX.write(exportedWorkbook, { type: 'buffer', bookType: 'xlsx' })
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.setHeader('Content-Disposition', 'attachment; filename="faculty-timetable-current.xlsx"')
    return response.send(fileData)
  } catch (error) {
    return response.status(500).json({ message: 'Unable to export the current faculty timetable.' })
  }
}
