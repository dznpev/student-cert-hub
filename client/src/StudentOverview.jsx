export default function StudentOverview({ student, participations, certificates }) {
  const metrics = [
    ['Lượt tham gia', participations.length],
    ['Lượt chờ duyệt', participations.filter(({ approvalStatus }) => approvalStatus === 'Pending').length],
    ['Chứng nhận còn hiệu lực', certificates.filter(({ status }) => status === 'Issued').length],
  ]

  return (
    <section aria-labelledby="student-overview-title">
      <h1 id="student-overview-title" className="page-title mb-2">Tổng quan cá nhân</h1>
      <p className="text-body-secondary mb-3">{student.fullName} · {student.studentCode} · Dữ liệu xem thử</p>
      <div className="row g-3">
        {metrics.map(([label, value]) => (
          <div className="col-12 col-md-4" key={label}>
            <dl className="card rounded-4 h-100 mb-0 p-3">
              <dt className="fw-medium">{label}</dt>
              <dd className="fs-3 fw-bold mb-0">{value}</dd>
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}
