import { useEffect, useMemo, useState } from 'react'

const classTimeOptions = [
  '09:30 - 10:30',
  '10:30 - 11:30',
  '11:30 - 12:30',
  '12:30 - 01:30',
  '01:30 - 02:30',
  '02:30 - 03:30',
  '03:30 - 04:30'
]
const hours = Array.from({ length: 24 }, (_, index) => index + 1)
const minutes = Array.from({ length: 60 }, (_, index) => index + 1)

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function getCurrentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function getSlotStartMinutes(slot) {
  const time = slot.split(' - ')[0]
  const [hours, minutes] = time.split(':').map(Number)
  const normalizedHours = hours >= 1 && hours <= 4 ? hours + 12 : hours

  return normalizedHours * 60 + minutes
}

function getSlotEndMinutes(slot) {
  const time = slot.split(' - ')[1]
  const [hours, minutes] = time.split(':').map(Number)
  const normalizedHours = hours >= 1 && hours <= 4 ? hours + 12 : hours

  return normalizedHours * 60 + minutes
}

function getClockMinutes(time) {
  const [hours, minutes] = String(time || '').split(':').map(Number)
  return hours * 60 + minutes
}

function getOriginalBranchCode(profile) {
  const department = String(profile.currentDepartment || profile.department || '').toLowerCase()
  if (department.includes('mathematics') || department.includes('humanities')) return 'MH'
  if (department.includes('physical sciences') || department.includes('physics')) return 'PS'
  if (department.includes('electrical') || department.includes('electronics') || department.includes('eee')) return 'EEE'
  if (department.includes('mechanical')) return 'ME'
  if (department.includes('computer science') || department.includes('cse')) return 'CSE'
  if (department.includes('management') || department.includes('mba')) return 'MBA'
  if (department.includes('common course')) return 'CC'
  if (department.includes('academic administration')) return 'EAA'
  return department.split(/[^a-z0-9]+/).filter(Boolean).map((word) => word[0]).join('').toUpperCase() || 'NA'
}

function getStatusLabel(profile) {
  if (!profile) return 'In Class'
  if (profile.source === 'Faculty update') {
    return profile.reason?.trim() ? `Updated: ${profile.reason}` : `Updated: ${profile.status}`
  }
  if (profile.status === 'In Class') return 'Busy (In Class)'
  if (profile.status === 'Available') return 'Free (Available)'
  return profile.status
}

function TimePicker({ value, onChange }) {
  const [hourText = '09', minuteText = '30'] = (value || '09:30').split(':')
  const selectedHour = Number(hourText) || 24
  const selectedMinute = Number(minuteText) || 60

  function updateTime(hour, minute) {
    const clockHour = hour === 24 ? 0 : hour
    const clockMinute = minute === 60 ? 0 : minute
    onChange(`${String(clockHour).padStart(2, '0')}:${String(clockMinute).padStart(2, '0')}`)
  }

  return (
    <span className="time-picker">
      <select aria-label="Select hour" value={selectedHour} onChange={(event) => updateTime(Number(event.target.value), selectedMinute)}>
        {hours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
      </select>
      <span>:</span>
      <select aria-label="Select minute" value={selectedMinute} onChange={(event) => updateTime(selectedHour, Number(event.target.value))}>
        {minutes.map((minute) => <option key={minute} value={minute}>{String(minute).padStart(2, '0')}</option>)}
      </select>
    </span>
  )
}

export default function StudentFacultySearch({ faculty, loading, error, student }) {
  const [filterKind, setFilterKind] = useState('teaching')
  const [selectedFilter, setSelectedFilter] = useState('CSE')
  const [selectedDate, setSelectedDate] = useState(getToday)
  const [selectedTime, setSelectedTime] = useState(getCurrentTime)
  const [timeWasSelectedManually, setTimeWasSelectedManually] = useState(false)
  const [selectedClass, setSelectedClass] = useState('')
  const [statusLookupMode, setStatusLookupMode] = useState('class')
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [profileSearch, setProfileSearch] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')

  useEffect(() => {
    if (timeWasSelectedManually || selectedDate !== getToday()) return undefined
    const timer = setInterval(() => setSelectedTime(getCurrentTime()), 10000)
    return () => clearInterval(timer)
  }, [selectedDate, timeWasSelectedManually])

  const selectedDay = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })

  const originalBranchOptions = useMemo(() => {
    const options = new Map()
    faculty.forEach((profile) => {
      const code = getOriginalBranchCode(profile)
      const name = profile.currentDepartment || profile.department || code
      if (!options.has(code)) options.set(code, { value: code, label: `${code} — ${name}` })
    })
    return Array.from(options.values()).sort((first, second) => first.value.localeCompare(second.value))
  }, [faculty])

  const teachingDepartmentOptions = useMemo(() => Array.from(new Set(faculty
    .map((profile) => String(profile.teachingDepartment || profile.department || '').trim().toUpperCase())
    .filter(Boolean))).sort(), [faculty])

  const filterOptions = useMemo(() => filterKind === 'original'
    ? originalBranchOptions
    : teachingDepartmentOptions.map((department) => ({ value: department, label: department })),
  [filterKind, originalBranchOptions, teachingDepartmentOptions])

  useEffect(() => {
    if (filterOptions.length && !filterOptions.some((option) => option.value === selectedFilter)) {
      setSelectedFilter(filterOptions[0].value)
    }
  }, [filterOptions, selectedFilter])

  const filteredFaculty = useMemo(() => faculty.filter((profile) => {
    if (filterKind === 'original') return getOriginalBranchCode(profile) === selectedFilter
    return String(profile.teachingDepartment || profile.department || '').trim().toUpperCase() === selectedFilter
  }), [faculty, filterKind, selectedFilter])

  const classOptions = useMemo(() => {
    const classes = new Set()
    faculty.forEach((member) => member.timetable?.forEach((slot) => {
      if (slot.semester && slot.section) classes.add(`${slot.semester}|${slot.section}`)
    }))
    return Array.from(classes).sort((first, second) => first.localeCompare(second, undefined, { numeric: true }))
  }, [faculty])

  const activeClass = (classOptions.includes(selectedClass) && selectedClass) || (classOptions.includes('V|5CSE1') ? 'V|5CSE1' : classOptions[0] || '')
  const [activeSemester, activeSection] = activeClass.split('|')

  const scheduledFaculty = useMemo(() => {
    const selectedMinute = getClockMinutes(selectedTime)
    return faculty.filter((member) =>
      member.timetable?.some((slot) =>
        slot.day === selectedDay &&
        slot.semester === activeSemester &&
        slot.section === activeSection &&
        getSlotStartMinutes(slot.slot) <= selectedMinute &&
        getSlotEndMinutes(slot.slot) > selectedMinute
      )
    )
  }, [activeSection, activeSemester, faculty, selectedDay, selectedTime])

  const facultyStatusProfiles = useMemo(() => faculty.map((profile) => {
    const selectedMinute = getClockMinutes(selectedTime)
    const manualStart = profile.availabilityStartTime && profile.availabilityEndTime
      ? getClockMinutes(profile.availabilityStartTime)
      : 0
    const manualEnd = profile.availabilityStartTime && profile.availabilityEndTime
      ? getClockMinutes(profile.availabilityEndTime)
      : 0
    const manualStatusApplies = profile.availabilityDate === selectedDate && manualStart <= selectedMinute && manualEnd > selectedMinute

    if (manualStatusApplies) {
      return { ...profile, status: profile.currentStatus, source: 'Faculty update', slot: null }
    }

    const slot = profile.timetable?.find((entry) =>
      entry.day === selectedDay &&
      getSlotStartMinutes(entry.slot) <= selectedMinute &&
      getSlotEndMinutes(entry.slot) > selectedMinute
    )

    return slot
      ? { ...profile, status: 'In Class', source: 'Scheduled class', slot }
      : { ...profile, status: 'Available', source: 'No class scheduled', slot: null }
  }), [faculty, selectedDate, selectedDay, selectedTime])

  const visibleFacultyProfiles = facultyStatusProfiles.filter((profile) =>
    filteredFaculty.some((filteredProfile) => filteredProfile._id === profile._id) &&
    (availabilityFilter === 'all' ||
      (availabilityFilter === 'available' ? profile.status === 'Available' : profile.status !== 'Available')) &&
    `${profile.name} ${profile.facultyId} ${getOriginalBranchCode(profile)} ${profile.currentDepartment} ${profile.teachingDepartment} ${profile.department} ${profile.designation}`.toLowerCase().includes(profileSearch.trim().toLowerCase())
  )
  const selectedProfile = visibleFacultyProfiles.find((profile) => profile._id === selectedProfileId) || visibleFacultyProfiles[0] || null

  const classDays = activeClass.startsWith('III|3CSE') || activeClass.startsWith('V|5CSE')
    ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const classSchedule = useMemo(() => {
    if (!activeClass) return []
    const [semester, section] = activeClass.split('|')
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const entries = faculty.flatMap((member) => member.timetable
      ?.filter((slot) => slot.semester === semester && slot.section === section)
      .map((slot) => ({ ...slot, facultyName: member.name, facultyId: member.facultyId })) || [])
      .sort((first, second) => {
        const dayDifference = dayOrder.indexOf(first.day) - dayOrder.indexOf(second.day)
        return dayDifference || getSlotStartMinutes(first.slot) - getSlotStartMinutes(second.slot) ||
          first.facultyId.localeCompare(second.facultyId, undefined, { numeric: true, sensitivity: 'base' })
      })

    const groupedEntries = entries.reduce((groups, entry) => {
      const key = JSON.stringify([entry.day, entry.slot, entry.semester, entry.section, entry.subject, entry.block, entry.room])
      const groupedEntry = groups.get(key)

      if (groupedEntry) {
        if (!groupedEntry.facultyIds.includes(entry.facultyId)) groupedEntry.facultyIds.push(entry.facultyId)
        if (!groupedEntry.facultyNames.includes(entry.facultyName)) groupedEntry.facultyNames.push(entry.facultyName)
      } else {
        groups.set(key, { ...entry, facultyIds: [entry.facultyId], facultyNames: [entry.facultyName] })
      }

      return groups
    }, new Map())

    const mergedEntries = Array.from(groupedEntries.values()).map((entry) => ({
      ...entry,
      facultyId: entry.facultyIds.sort((first, second) => first.localeCompare(second, undefined, { numeric: true, sensitivity: 'base' })).join('|'),
      facultyName: entry.facultyNames.join(' / ')
    })).reduce((currentEntries, entry) => {
      const previousEntry = currentEntries.at(-1)
      const sameLab = entry.subject.toLowerCase().includes('lab') && previousEntry &&
        previousEntry.subject === entry.subject &&
        previousEntry.facultyId === entry.facultyId &&
        previousEntry.section === entry.section &&
        previousEntry.day === entry.day &&
        getSlotEndMinutes(previousEntry.slot) === getSlotStartMinutes(entry.slot)

      if (sameLab) {
        previousEntry.slot = `${previousEntry.slot.split(' - ')[0]} - ${entry.slot.split(' - ')[1]}`
        return currentEntries
      }

      return [...currentEntries, { ...entry }]
    }, [])

    return mergedEntries
  }, [activeClass, faculty])

  const classTimes = classTimeOptions

  return (
    <section className="page-section student-layout">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Student view</p>
          <h2>Find your faculty</h2>
          <p className="section-description">Hi {student.rollNo}, use Find faculty profile to filter by original branch or teaching department.</p>
        </div>
        <div className="student-summary">
          <span className="student-pill">{student.rollNo}</span>
        </div>
      </div>

      <section className="class-timetable-panel">
        <div className="class-timetable-heading">
          <div>
            <p className="eyebrow">New view</p>
            <h3>Class-wise timetable</h3>
            <p className="section-description">
              {{
                'III|3CSE1': 'Academic Year 2026–27 | III Semester | 3CSE1 | Classroom B-V-202 | Class Teacher: Smt. G. Ashmitha (GA)',
                'III|3CSE2': 'Academic Year 2026–27 | III Semester | 3CSE2 | Classroom B-V-204 | Class Teacher: Smt. M. Preethi (MP)',
                'III|3CSE3': 'Academic Year 2026–27 | III Semester | 3CSE3 | Classroom B-V-302 | Class Teacher: Smt. R. Radhika (RK)',
                'III|3CSE4': 'Academic Year 2026–27 | III Semester | 3CSE4 | Classroom B-V-304 | Class Teacher: Sri. R. Rajesh (RR)',
                'III|3CSE5': 'Academic Year 2026–27 | III Semester | 3CSE5 | Classroom B-IV-213 | Class Teacher: Dr. T. Ranjith Kumar (TRK)',
                'III|3CSE6': 'Academic Year 2026–27 | III Semester | 3CSE6 | Classroom B-IV-214 | Class Teacher: Sri K. Ravi (KR)',
                'V|5CSE1': 'Academic Year 2026–27 | V Semester | 5CSE1 | Classroom B-IV-014 | Class Teacher: Dr. D. Sudha (DS)',
                'V|5CSE2': 'Academic Year 2026–27 | V Semester | 5CSE2 | Classroom B-IV-126 | Class Teacher: Dr. G. Sridhar (GS)',
                'V|5CSE3': 'Academic Year 2026–27 | V Semester | 5CSE3 | Classroom B-IV-127 | Class Teacher: Dr. Md. Sharfuddin Waseem (W)',
                'V|5CSE4': 'Academic Year 2026–27 | V Semester | 5CSE4 | Classroom B-IV-215 | Class Teacher: Dr. N. Gayatri (NG)',
                'V|5CSE5': 'Academic Year 2026–27 | V Semester | 5CSE5 | Classroom B-IV-214 | Class Teacher: Smt. V. Gouthami (VG)'
              }[activeClass] || 'See every subject and faculty assigned to one class.'}
            </p>
          </div>
          <label className="search-box class-selector">
            <span>Select semester and section</span>
            <select value={activeClass} onChange={(event) => setSelectedClass(event.target.value)}>
              {classOptions.map((className) => {
                const [semester, section] = className.split('|')
                return <option key={className} value={className}>{semester} Semester - {section}</option>
              })}
            </select>
          </label>
        </div>
        {classSchedule.length > 0 ? (
          <div className="class-timetable-scroll">
            <table className="class-timetable-table">
              <thead>
                <tr>
                  <th>Day</th>
                  {classTimes.map((time) => <th key={time}>{time}</th>)}
                </tr>
              </thead>
              <tbody>
                {classDays.map((day) => (
                  <tr key={day}>
                    <th>{day}</th>
                    {classTimes.map((time) => {
                      const currentStart = getSlotStartMinutes(time)
                      if (time === '01:30 - 02:30') {
                        return <td className="lunch-break-cell" key={`${time}-${day}`}>Lunch Break</td>
                      }

                      const dayEntries = classSchedule.filter((slot) => slot.day === day)
                      const coveredByPreviousClass = dayEntries.some((slot) => {
                        const slotStart = getSlotStartMinutes(slot.slot)
                        return slotStart < currentStart && getSlotEndMinutes(slot.slot) > currentStart
                      })
                      if (coveredByPreviousClass) return null

                      const entries = dayEntries.filter((slot) => getSlotStartMinutes(slot.slot) === currentStart)
                      const longestDuration = Math.max(1, ...entries.map((slot) => Math.ceil((getSlotEndMinutes(slot.slot) - currentStart) / 60)))
                      const cellEnd = currentStart + longestDuration * 60
                      const visibleEntries = dayEntries.filter((slot) => {
                        const slotStart = getSlotStartMinutes(slot.slot)
                        const fallsInsideCell = slotStart >= currentStart && slotStart < cellEnd
                        const hiddenAtCellBoundary = slotStart === cellEnd && dayEntries.some((otherSlot) =>
                          otherSlot !== slot &&
                          getSlotStartMinutes(otherSlot.slot) < slotStart &&
                          getSlotEndMinutes(otherSlot.slot) > slotStart
                        )
                        return fallsInsideCell || hiddenAtCellBoundary
                      })
                      return (
                        <td key={`${time}-${day}`} colSpan={entries.length > 0 ? longestDuration : 1}>
                          {visibleEntries.map((slot, index) => (
                            <div className="class-timetable-cell" key={`${slot.facultyId}-${index}`}>
                              <strong>{slot.subject}</strong>
                              <span>{slot.facultyName}</span>
                              {getSlotStartMinutes(slot.slot) !== currentStart && <small>{slot.slot}</small>}
                              <small>Section: {slot.section} | Teaching block: {slot.block || 'Not specified'}{slot.room ? ` | Room: ${slot.room}` : ''}</small>
                            </div>
                          ))}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="message">No class timetable is available yet.</p>
        )}
      </section>

      <div className="schedule-filter">
        <label className="search-box">
          <span>Select date</span>
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <label className="search-box">
          <span>Select time</span>
          <TimePicker value={selectedTime} onChange={(time) => { setSelectedTime(time); setTimeWasSelectedManually(true) }} />
        </label>
        <p className="schedule-selection">{selectedDay}, {selectedTime}</p>
      </div>

      <div className="auth-toggle" role="tablist" aria-label="Faculty status view">
        <button type="button" role="tab" aria-selected={statusLookupMode === 'class'} className={statusLookupMode === 'class' ? 'toggle-button toggle-button--active' : 'toggle-button'} onClick={() => setStatusLookupMode('class')}>
          Selected class
        </button>
        <button type="button" role="tab" aria-selected={statusLookupMode === 'all'} className={statusLookupMode === 'all' ? 'toggle-button toggle-button--active' : 'toggle-button'} onClick={() => setStatusLookupMode('all')}>
          All faculty
        </button>
      </div>

      {loading && <p className="message">Loading faculty...</p>}
      {error && <p className="message message--error">{error}</p>}

      {!loading && !error && statusLookupMode === 'class' && (
        <>
          {scheduledFaculty.length === 0 && (
            <p className="message">No faculty from {activeSection} is scheduled for {selectedDay} at {selectedTime}.</p>
          )}
          {scheduledFaculty.length > 0 && (
            <section className="faculty-status-list" aria-label="Faculty current status for selected class">
              <h3>Current status · {activeSection}</h3>
              {scheduledFaculty.map((member) => {
                const statusProfile = facultyStatusProfiles.find((profile) => profile._id === member._id)
                const classSlot = member.timetable?.find((slot) =>
                  slot.day === selectedDay &&
                  slot.semester === activeSemester &&
                  slot.section === activeSection &&
                  getSlotStartMinutes(slot.slot) <= getClockMinutes(selectedTime) &&
                  getSlotEndMinutes(slot.slot) > getClockMinutes(selectedTime)
                )

                return (
                  <div className="detail-row" key={member.facultyId}>
                    <span>
                      {member.name}
                      {classSlot && <small className="faculty-meta">{classSlot.subject} | Teaching block: {classSlot.block || 'Not specified'}{classSlot.room ? ` | Room: ${classSlot.room}` : ''}</small>}
                    </span>
                    <strong className={`status-text status-text--${(statusProfile?.status || 'In Class').toLowerCase().replaceAll(' ', '-')}`}>
                      {getStatusLabel(statusProfile)}
                    </strong>
                  </div>
                )
              })}
            </section>
          )}
        </>
      )}

      {!loading && !error && statusLookupMode === 'all' && (
        <section className="faculty-status-list" aria-label="Selected faculty status">
          <div className="faculty-search-controls">
            <label className="search-box">
              <span>Filter by</span>
              <select value={filterKind} onChange={(event) => setFilterKind(event.target.value)}>
                <option value="original">Original branch code</option>
                <option value="teaching">Teaching department</option>
              </select>
            </label>
            <label className="search-box">
              <span>{filterKind === 'original' ? 'Select original branch' : 'Select teaching department'}</span>
              <select value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)}>
                {filterOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="search-box">
              <span>Filter by availability</span>
              <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}>
                <option value="all">All faculty</option>
                <option value="busy">Busy</option>
                <option value="available">Free (Available)</option>
              </select>
            </label>
            <label className="search-box faculty-directory-search">
              <span>Find faculty profile</span>
              <input value={profileSearch} onChange={(event) => setProfileSearch(event.target.value)} placeholder="Search name, ID, or department" />
            </label>
          </div>
          <div className="faculty-directory" role="list" aria-label="Faculty profiles">
            {visibleFacultyProfiles.map((profile) => (
              <button
                type="button"
                role="listitem"
                aria-pressed={profile._id === selectedProfile?._id}
                className={profile._id === selectedProfile?._id ? 'faculty-directory-row faculty-directory-row--selected' : 'faculty-directory-row'}
                key={profile._id}
                onClick={() => setSelectedProfileId(profile._id)}
              >
                <span className="faculty-directory-identity">
                  <strong>{profile.name}</strong>
                  <small>Faculty ID: {profile.facultyId} · Original branch code: {getOriginalBranchCode(profile)} · {profile.currentDepartment || profile.department}</small>
                </span>
                <strong className={`status-text status-text--${profile.status.toLowerCase().replaceAll(' ', '-')}`}>
                  {getStatusLabel(profile)}
                </strong>
              </button>
            ))}
            {visibleFacultyProfiles.length === 0 && <p className="message">No faculty profiles match this search.</p>}
          </div>
          {selectedProfile && (
            <>
              <h3>{selectedProfile.name}</h3>
              <p className="faculty-meta">Faculty ID: {selectedProfile.facultyId} · Original branch code: {getOriginalBranchCode(selectedProfile)} · Original branch: {selectedProfile.currentDepartment || selectedProfile.department} · Teaching branch: {selectedProfile.teachingDepartment || selectedProfile.department}</p>
              <div className="detail-row">
                <span>Status · {selectedDay}, {selectedTime}</span>
                <strong className={`status-text status-text--${selectedProfile.status.toLowerCase().replaceAll(' ', '-')}`}>
                  {getStatusLabel(selectedProfile)}
                </strong>
              </div>
              {selectedProfile.source === 'Faculty update'
                ? <p className="faculty-meta">Faculty update active until {selectedProfile.availabilityEndTime}</p>
                : <p className="faculty-meta">{selectedProfile.source}</p>}
              {selectedProfile.slot && (
                <p className="faculty-meta">
                  {selectedProfile.slot.subject}{selectedProfile.slot.section ? ` · ${selectedProfile.slot.section}` : ''}{selectedProfile.slot.block ? ` · Teaching block: ${selectedProfile.slot.block}` : ' · Teaching block: Not specified'}{selectedProfile.slot.room ? ` · Room: ${selectedProfile.slot.room}` : ''}
                </p>
              )}
              {selectedProfile.currentLocation && <p className="faculty-meta">Location: {selectedProfile.currentLocation}</p>}
            </>
          )}
        </section>
      )}
    </section>
  )
}
