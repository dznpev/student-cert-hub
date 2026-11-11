import { sampleCohorts } from './sampleCohorts.js'

const sampleStudents = [
  { studentCode: '02400001', fullName: 'Nguyễn Minh Anh', email: '02400001@example.com', className: '24DTHA1', cohortId: 24, userId: 'demo-01' },
  { studentCode: '02400002', fullName: 'Trần Gia Hân', email: '02400002@example.com', className: '24DQTA1', cohortId: 24, userId: null },
  { studentCode: '02300001', fullName: 'Lê Hoàng Nam', email: '02300001@example.com', className: '23DTHA1', cohortId: 23, userId: 'demo-03' },
  { studentCode: '02300002', fullName: 'Phạm Ngọc Linh', email: null, className: null, cohortId: 23, userId: null },
]

export default function StudentsPage() {
  return (
    <>
      <h1 className="page-title mb-2">Sinh viên</h1>
      <p className="text-body-secondary mb-4">Dữ liệu mẫu</p>

      <div className="card rounded-4">
        <div className="card-body p-3 p-md-4">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <caption className="visually-hidden">Danh sách sinh viên mẫu</caption>
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
