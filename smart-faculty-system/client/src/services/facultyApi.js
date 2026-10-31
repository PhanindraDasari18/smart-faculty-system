async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })

  const text = await response.text()
  const data = text ? JSON.parse(text) : {}

  if (!response.ok) {
    const details = Array.isArray(data.errors) ? ` ${data.errors.join(' ')}` : ''
    throw new Error(`${data.message || 'Request failed'}${details}`)
  }

  return data
}

export function getFaculty() {
  return request('/api/faculty')
}

export function registerStudent({ rollNo, password, email }) {
  return request('/api/student/register', {
    method: 'POST',
    body: JSON.stringify({ rollNo, password, email })
  })
}

export function loginStudent({ rollNo, password }) {
  return request('/api/student/login', {
    method: 'POST',
    body: JSON.stringify({ rollNo, password })
  })
}

export function registerFaculty({ facultyId, password, email }) {
  return request('/api/faculty/register', {
    method: 'POST',
    body: JSON.stringify({ facultyId, password, email })
  })
}

export function requestPasswordReset(type, id) {
  const path = type === 'student' ? '/api/student/forgot-password' : '/api/faculty/forgot-password'
  return request(path, { method: 'POST', body: JSON.stringify({ type, id }) })
}

export function resetPassword(type, token, password) {
  const path = type === 'student' ? '/api/student/reset-password' : '/api/faculty/reset-password'
  return request(path, { method: 'POST', body: JSON.stringify({ type, token, password }) })
}

export function loginFaculty({ facultyId, password }) {
  return request('/api/faculty/login', {
    method: 'POST',
    body: JSON.stringify({ facultyId, password })
  })
}

export function registerAdmin({ username, password }) {
  return request('/api/faculty/admin/register', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

export function loginAdmin({ username, password }) {
  return request('/api/faculty/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

export function createFaculty(faculty) {
  return request('/api/faculty', {
    method: 'POST',
    body: JSON.stringify(faculty)
  })
}

export function updateFacultyStatus(id, currentStatus, availabilityDate, availabilityStartTime, availabilityEndTime) {
  return request(`/api/faculty/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ currentStatus, availabilityDate, availabilityStartTime, availabilityEndTime })
  })
}

export function clearMyAvailability(token) {
  return request('/api/faculty/me/availability', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  })
}

export function updateFacultyLocation(id, currentLocation) {
  return request(`/api/faculty/${id}/location`, {
    method: 'PUT',
    body: JSON.stringify({ currentLocation })
  })
}

export function updateFacultyReason(id, reason) {
  return request(`/api/faculty/${id}/reason`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  })
}

export function updateFacultyTimetable(id, timetable) {
  return request(`/api/faculty/${id}/timetable`, {
    method: 'PUT',
    body: JSON.stringify({ timetable })
  })
}

export function importTimetableWorkbook(fileName, fileBase64) {
  return request('/api/faculty/timetable/import', {
    method: 'POST',
    body: JSON.stringify({ fileName, fileBase64 })
  })
}

export function getTimetableImportHistory() {
  return request('/api/faculty/timetable/imports')
}

export function updateMyTimetable(timetable, token) {
  return request('/api/faculty/me/timetable', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ timetable })
  })
}
