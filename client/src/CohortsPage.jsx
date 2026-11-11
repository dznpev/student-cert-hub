import { sampleCohorts } from './sampleCohorts.js'

export default function CohortsPage() {
  return (
    <>
      <h1 className="page-title mb-4">Khóa tuyển sinh</h1>
      <div className="card cohorts-card">
        <div className="card-body p-3 p-md-4">
          <table className="table align-middle mb-0 admin-data-table cohorts-table text-center">
            <caption className="visually-hidden">Danh sách khóa tuyển sinh mẫu</caption>
            <thead>
              <tr>
                <th scope="col" className="text-start">Mã khóa</th>
                <th scope="col">Tên khóa</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {sampleCohorts.map(({ cohortCode, cohortName, isActive }) => (
                <tr key={cohortCode}>
                  <th scope="row" className="text-start">{cohortCode}</th>
                  <td>{cohortName}</td>
                  <td>
                    <span className={isActive ? 'badge text-wrap text-bg-success' : 'badge text-wrap text-bg-secondary'}>
                      {isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
