import { useRef, useState } from 'react'
import { normalizeSearch } from './normalizeSearch.js'
import { createStudentComparator } from './sortRecords.js'
import { getStudentAccountStatus, studentAccountStatuses } from './studentAccountStatuses.js'

export default function StudentsPage({ cohorts, students }) {
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const profileTrigger = useRef(null)
  const [selectedCohort, setSelectedCohort] = useState('')
  const [selectedAccountStatus, setSelectedAccountStatus] = useState('')
  const query = normalizeSearch(search.trim().replace(/\s+/g, ' '))
  const visibleStudents = students.filter((student) => {
    const { studentCode, fullName, className, cohortId } = student
    const matchesCohort = selectedCohort === '' || String(cohortId) === selectedCohort
    const matchesSearch = [studentCode, fullName, className ?? ''].some((field) => normalizeSearch(field).includes(query))
    return matchesCohort && matchesSearch && (!selectedAccountStatus || getStudentAccountStatus(student) === selectedAccountStatus)
  }).sort(createStudentComparator(cohorts))

  function closeProfile() {
    setSelectedStudent(null)
    requestAnimationFrame(() => profileTrigger.current?.focus())
  }

  if (selectedStudent) {
    const cohort = cohorts.find(({ cohortId }) => cohortId === selectedStudent.cohortId)
    const fields = [
      ['MSSV', selectedStudent.studentCode],
      ['Họ và tên', selectedStudent.fullName],
      ['Email', selectedStudent.email ?? 'Chưa có'],
      ['Lớp', selectedStudent.className ?? 'Chưa có'],
      ['Khóa tuyển sinh', cohort ? cohort.cohortCode + ' · ' + cohort.cohortName : 'Chưa xác định'],
      ['Tình trạng tài khoản', studentAccountStatuses[getStudentAccountStatus(selectedStudent)].label],
    ]

    return (
      <>
        <button type="button" className="btn btn-outline-primary mb-3" onClick={closeProfile} autoFocus>
          Quay lại danh sách
        </button>
        <h1 className="page-title mb-2">Hồ sơ sinh viên</h1>
        <p className="text-body-secondary mb-4">Dữ liệu mẫu</p>
        <section className="card rounded-4" aria-label={'Hồ sơ ' + selectedStudent.fullName}>
          <div className="card-body p-3 p-md-4">
            <dl className="row g-3 mb-0">
              {fields.map(([label, value]) => (
                <div className="col-12 col-md-6" key={label}>
                  <dt className="text-body-secondary fw-medium">{label}</dt>
                  <dd className="mb-0 text-break">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <h1 className="page-title mb-2">Sinh viên</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu</p>

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 mb-3">
            <div className="col-12 col-sm-7 col-xl-5">
              <label className="form-label" htmlFor="student-search">Tìm kiếm</label>
              <input
                id="student-search"
                type="search"
                className="form-control"
                placeholder="Nhập MSSV, họ tên hoặc lớp"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="col-12 col-sm-5 col-xl-3">
              <label className="form-label" htmlFor="student-cohort">Khóa tuyển sinh</label>
              <select
                id="student-cohort"
                className="form-select"
                value={selectedCohort}
                onChange={(event) => setSelectedCohort(event.target.value)}
              >
                <option value="">Tất cả khóa</option>
                {cohorts.map(({ cohortId, cohortCode }) => (
                  <option key={cohortId} value={cohortId}>{cohortCode}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-xl-4">
              <label className="form-label" htmlFor="student-account-status">Tình trạng tài khoản</label>
              <select id="student-account-status" className="form-select" value={selectedAccountStatus}
                onChange={(event) => setSelectedAccountStatus(event.target.value)}>
                <option value="">Tất cả tình trạng</option>
                {Object.entries(studentAccountStatuses).map(([value, { label }]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-table-scroll" role="region" aria-label="Danh sách sinh viên" tabIndex={0}>
            <table className="table align-middle mb-0 admin-data-table students-table">
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
                        <span className={'badge text-wrap ' + accountStatus.badge}>
                          {accountStatus.label}
                        </span>
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
                            setSelectedStudent(student)
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
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
