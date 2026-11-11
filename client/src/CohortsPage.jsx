const sampleCohorts = [
  { cohortCode: 'K24', cohortName: 'Khóa tuyển sinh 2024', isActive: true },
  { cohortCode: 'K23', cohortName: 'Khóa tuyển sinh 2023', isActive: true },
  { cohortCode: 'K22', cohortName: 'Khóa tuyển sinh 2022', isActive: false },
]

export default function CohortsPage() {
  return (
    <>
      <h1 className="page-title mb-4">Khóa tuyển sinh</h1>
      <div className="card cohorts-card">
        <div className="card-body p-3 p-md-4">
          <table className="table align-middle mb-0">
            <caption className="visually-hidden">Danh sách khóa tuyển sinh mẫu</caption>
            <thead>
              <tr>
                <th scope="col">Mã khóa</th>
                <th scope="col">Tên khóa</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {sampleCohorts.map(({ cohortCode, cohortName, isActive }) => (
                <tr key={cohortCode}>
                  <th scope="row">{cohortCode}</th>
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
