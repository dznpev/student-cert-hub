import { sampleCohorts } from './sampleCohorts.js'
import { sampleStudents } from './sampleStudents.js'

export default function StudentsPage() {
  return (
    <>
      <h1 className="page-title mb-2">Sinh viên</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu</p>

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
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
              </colgroup>
              <thead>
                <tr>
                  <th scope="col">MSSV</th>
                  <th scope="col">Họ và tên</th>
                  <th scope="col">Email</th>
                  <th scope="col">Lớp</th>
                  <th scope="col">Khóa tuyển sinh</th>
                  <th scope="col">Tài khoản</th>
                </tr>
              </thead>
              <tbody>
                {sampleStudents.map((student) => {
                  const cohort = sampleCohorts.find(({ cohortId }) => cohortId === student.cohortId)
                  const hasAccount = student.userId !== null

                  return (
                    <tr key={student.studentCode}>
                      <th scope="row">{student.studentCode}</th>
                      <td>{student.fullName}</td>
                      <td>{student.email ?? 'Chưa có'}</td>
                      <td>{student.className ?? 'Chưa có'}</td>
                      <td>{cohort?.cohortCode ?? 'Chưa xác định'}</td>
                      <td>
                        <span className={hasAccount ? 'badge text-bg-success' : 'badge text-bg-secondary'}>
                          {hasAccount ? 'Đã liên kết' : 'Chưa liên kết'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
