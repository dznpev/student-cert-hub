import { useRef, useState } from 'react'
import { normalizeSearch } from './normalizeSearch.js'
import { createStudentComparator } from './sortRecords.js'
import PortalChip from './components/PortalChip.jsx'
import PortalPageHeader from './components/PortalPageHeader.jsx'
import PortalPanel from './components/PortalPanel.jsx'
import PortalTable from './components/PortalTable.jsx'
import { getStudentAccountStatus, studentAccountStatuses } from './studentAccountStatuses.js'
import StudentProfileForm from './StudentProfileForm.jsx'

export default function StudentsPage({ cohorts, students, onUpdateStudentActive, onUpdateStudentProfile, search = '' }) {
  const [selectedStudentId, setSelectedStudentId] = useState(null)
  const [confirmProfileStatus, setConfirmProfileStatus] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const selectedStudent = students.find(({ studentId }) => studentId === selectedStudentId)
  const profileTrigger = useRef(null)
  const [selectedCohort, setSelectedCohort] = useState('')
  const [selectedAccountStatus, setSelectedAccountStatus] = useState('')
  const [selectedProfileStatus, setSelectedProfileStatus] = useState('')
  const query = normalizeSearch(search.trim().replace(/\s+/g, ' '))
  const visibleStudents = students.filter((student) => {
    const { studentCode, fullName, className, cohortId } = student
    const matchesCohort = selectedCohort === '' || String(cohortId) === selectedCohort
    const matchesSearch = [studentCode, fullName, className ?? ''].some((field) => normalizeSearch(field).includes(query))
    const matchesProfile = selectedProfileStatus === ''
      || (student.isActive !== false) === (selectedProfileStatus === 'active')
    return matchesCohort && matchesSearch && matchesProfile && (!selectedAccountStatus || getStudentAccountStatus(student) === selectedAccountStatus)
  }).sort(createStudentComparator(cohorts))

  function closeProfile() {
    setSelectedStudentId(null)
    setConfirmProfileStatus(false)
    setEditingProfile(false)
    requestAnimationFrame(() => {
      const target = profileTrigger.current?.isConnected ? profileTrigger.current : document.querySelector('.portal-search__input')
      target?.focus()
    })
  }

  if (selectedStudent) {
    const isActive = selectedStudent.isActive !== false
    const cohort = cohorts.find(({ cohortId }) => cohortId === selectedStudent.cohortId)
    const fields = [
      ['MSSV', selectedStudent.studentCode],
      ['Họ và tên', selectedStudent.fullName],
      ['Email', selectedStudent.email ?? 'Chưa có'],
      ['Lớp', selectedStudent.className ?? 'Chưa có'],
      ['Khóa tuyển sinh', cohort ? cohort.cohortCode + ' · ' + cohort.cohortName : 'Chưa xác định'],
      ['Tình trạng tài khoản', studentAccountStatuses[getStudentAccountStatus(selectedStudent)].label],
      ['Tình trạng hồ sơ', isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'],
    ]

    return (
      <>
        <button type="button" className="btn btn-outline-primary mb-3" onClick={closeProfile} autoFocus>
          Quay lại danh sách
        </button>
        <PortalPageHeader title="Hồ sơ sinh viên" description="Dữ liệu mẫu" />
        <PortalPanel className="portal-panel--padded" titleId="student-profile-title" title={'Hồ sơ ' + selectedStudent.fullName}>
            {editingProfile ? (
              <StudentProfileForm student={selectedStudent} cohorts={cohorts} onCancel={() => setEditingProfile(false)}
                onSave={(values) => {
                  const errors = onUpdateStudentProfile(selectedStudent.studentId, values)
                  if (!Object.keys(errors).length) setEditingProfile(false)
                  return errors
                }} />
            ) : (
              <>
            <dl className="row g-3 mb-0">
              {fields.map(([label, value]) => (
                <div className="col-12 col-md-6" key={label}>
                  <dt className="text-body-secondary fw-medium">{label}</dt>
                  <dd className="mb-0 text-break">{value}</dd>
                </div>
              ))}
            </dl>
            {confirmProfileStatus ? (
              <section className="alert alert-warning mt-4 mb-0" aria-labelledby="student-profile-status-title">
                <h2 id="student-profile-status-title" className="h6">
                  {isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'} hồ sơ {selectedStudent.studentCode}?
                </h2>
                <p>KPI và tỷ lệ tham gia sẽ cập nhật theo trạng thái hồ sơ trong phiên.</p>
                <div className="d-flex flex-wrap gap-2">
                  <button type="button" className={'btn ' + (isActive ? 'btn-danger' : 'btn-success')}
                    onClick={() => {
                      onUpdateStudentActive(selectedStudent.studentId, !isActive)
                      setConfirmProfileStatus(false)
                    }}>Xác nhận</button>
                  <button type="button" className="btn btn-outline-secondary" autoFocus onClick={() => setConfirmProfileStatus(false)}>Hủy</button>
                </div>
              </section>
            ) : (
              <div className="d-flex flex-wrap gap-2 mt-4">
                <button type="button" className="btn btn-primary" onClick={() => setEditingProfile(true)}>Sửa hồ sơ</button>
                <button type="button" className={'btn ' + (isActive ? 'btn-outline-danger' : 'btn-outline-success')}
                  onClick={() => setConfirmProfileStatus(true)}>{isActive ? 'Ngừng sử dụng hồ sơ' : 'Sử dụng lại hồ sơ'}</button>
              </div>
            )}
              </>
            )}
        </PortalPanel>
      </>
    )
  }

  return (
    <>
      <PortalPageHeader title="Sinh viên" description="Dữ liệu mẫu" />

      <PortalPanel className="portal-panel--stacked portal-panel--padded">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-6 col-xl-2">
              <label className="form-label" htmlFor="student-cohort">Khóa tuyển sinh</label>
              <select
                id="student-cohort"
                className="fld w-100"
                value={selectedCohort}
                onChange={(event) => setSelectedCohort(event.target.value)}
              >
                <option value="">Tất cả khóa</option>
                {cohorts.map(({ cohortId, cohortCode }) => (
                  <option key={cohortId} value={cohortId}>{cohortCode}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <label className="form-label" htmlFor="student-account-status">Tình trạng tài khoản</label>
              <select id="student-account-status" className="fld w-100" value={selectedAccountStatus}
                onChange={(event) => setSelectedAccountStatus(event.target.value)}>
                <option value="">Tất cả tình trạng</option>
                {Object.entries(studentAccountStatuses).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-xl-3">
              <label className="form-label" htmlFor="student-profile-status">Tình trạng hồ sơ</label>
              <select id="student-profile-status" className="fld w-100" value={selectedProfileStatus}
                onChange={(event) => setSelectedProfileStatus(event.target.value)}>
                <option value="">Tất cả hồ sơ</option>
                <option value="active">Đang sử dụng</option>
                <option value="inactive">Ngừng sử dụng</option>
              </select>
            </div>
          </div>
      </PortalPanel>
      <PortalPanel>
          <PortalTable label="Danh sách sinh viên" minWidth="60rem" stickyActions>
              <caption className="visually-hidden">Danh sách sinh viên mẫu</caption>
              <colgroup>
                <col className="students-col-code" />
                <col className="students-col-name" />
                <col />
                <col className="students-col-class" />
                <col className="students-col-cohort" />
                <col className="students-col-account" />
                <col className="students-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">MSSV</th>
                  <th scope="col">Họ và tên</th>
                  <th scope="col">Email</th>
                  <th scope="col">Lớp</th>
                  <th scope="col">Khóa tuyển sinh</th>
                  <th scope="col">Tài khoản</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visibleStudents.map((student) => {
                  const cohort = cohorts.find(({ cohortId }) => cohortId === student.cohortId)
                  const accountStatus = studentAccountStatuses[getStudentAccountStatus(student)]

                  return (
                    <tr key={student.studentCode}>
                      <th scope="row">{student.studentCode}</th>
                      <td>{student.fullName}</td>
                      <td>{student.email ?? 'Chưa có'}</td>
                      <td>{student.className ?? 'Chưa có'}</td>
                      <td>{cohort?.cohortCode ?? 'Chưa xác định'}</td>
                      <td>
                        <PortalChip tone={accountStatus.tone} label={accountStatus.label} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary text-nowrap"
                          aria-label={'Xem hồ sơ ' + student.studentCode}
                          ref={(element) => {
                            if (element && profileTrigger.current?.getAttribute('aria-label') === element.getAttribute('aria-label')) {
                              profileTrigger.current = element
                            }
                          }}
                          onClick={(event) => {
                            profileTrigger.current = event.currentTarget
                            setSelectedStudentId(student.studentId)
                          }}
                        >
                          Xem hồ sơ
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {visibleStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-body-secondary">Không tìm thấy sinh viên phù hợp.</td>
                  </tr>
                )}
              </tbody>
          </PortalTable>
      </PortalPanel>
    </>
  )
}
