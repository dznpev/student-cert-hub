import { certificateStatuses } from './certificateStatuses.js'
import { approvalStatuses } from './approvalStatuses.js'
import { compareCodesDescending } from './sortRecords.js'

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh',
})

export default function StudentRecords({ page, studentId, activities, participations, certificates }) {
  const showCertificates = page === 'certificates'
  const title = showCertificates ? 'Chứng nhận' : 'Lượt tham gia'
  const activitiesById = new Map(activities.map((item) => [item.activityId, item]))
  const certificatesByParticipation = new Map(certificates.map((item) => [item.participationId, item]))
  const records = participations.filter((item) => item.studentId === studentId)
    .map((participation) => ({
      participation,
      activity: activitiesById.get(participation.activityId),
      certificate: certificatesByParticipation.get(participation.participationId),
    }))
    .filter((item) => !showCertificates || item.certificate)
    .sort((left, right) => compareCodesDescending(left.activity?.code, right.activity?.code)
      || right.participation.participationId - left.participation.participationId)

  return (
    <section className="card rounded-4" aria-labelledby="student-records-title">
      <div className="card-body p-3 p-md-4">
        <h1 id="student-records-title" className="page-title mb-3">{title}</h1>
        {showCertificates && <p className="text-body-secondary">Chứng nhận trong bản xem thử. Tệp PDF chưa được cung cấp.</p>}
        {records.length === 0 ? (
          <p className="text-body-secondary mb-0">{showCertificates ? 'Bạn chưa có chứng nhận.' : 'Bạn chưa có lượt tham gia.'}</p>
        ) : (
          <ul className="list-group list-group-flush">
            {records.map(({ participation, activity, certificate }) => {
              const status = showCertificates
                ? certificateStatuses.find((item) => item.status === certificate.status)
                : approvalStatuses[participation.approvalStatus]
              const reason = showCertificates
                ? certificate.status === 'Revoked' && certificate.revocationReason
                : participation.approvalStatus === 'Rejected' && participation.rejectedReason
              return (
                <li className="list-group-item px-0 py-3" key={participation.participationId}>
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                    <h2 className="h6 mb-0 text-break">{activity?.name ?? 'Hoạt động chưa xác định'}</h2>
                    <span className={'badge text-wrap ' + (status?.badge ?? 'text-bg-secondary')}>{status?.label ?? 'Chưa xác định'}</span>
                  </div>
                  {activity?.code && <p className="small text-body-secondary mb-0 mt-1">{activity.code}</p>}
                  {showCertificates && (
                    <dl className="mt-2 mb-0">
                      <dt>Mã chứng nhận</dt><dd className="text-break">{certificate.certificateCode}</dd>
                      <dt>Ngày phát hành</dt><dd className="mb-0">{certificate.issuedAt ? dateFormatter.format(new Date(certificate.issuedAt)) : 'Chưa phát hành'}</dd>
                    </dl>
                  )}
                  {reason && <p className="mb-0 mt-2 text-break"><strong>{showCertificates ? 'Lý do thu hồi' : 'Lý do từ chối'}</strong> · {reason}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
