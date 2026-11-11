import { useState, useSyncExternalStore } from 'react'
import AdminLayout from './AdminLayout.jsx'
import ActivitiesPage from './ActivitiesPage.jsx'
import AuditLogsPage from './AuditLogsPage.jsx'
import CertificatesPage from './CertificatesPage.jsx'
import CohortsPage from './CohortsPage.jsx'
import DashboardPage from './DashboardPage.jsx'
import ImportsPage from './ImportsPage.jsx'
import StudentPortal from './StudentPortal.jsx'
import ParticipationsPage from './ParticipationsPage.jsx'
import StudentsPage from './StudentsPage.jsx'
import { sampleCohorts } from './sampleCohorts.js'
import { sampleActivities } from './sampleActivities.js'
import { sampleStudents } from './sampleStudents.js'
import { sampleParticipations } from './sampleParticipations.js'
import { sampleImportHistory } from './sampleImportHistory.js'
import { reviewParticipations } from './reviewParticipations.js'
import { sampleCertificates } from './sampleCertificates.js'
import { sampleCertificateTemplates } from './sampleCertificateTemplates.js'
import { queueCertificates, processCertificate } from './queueCertificates.js'
import { compareCodesDescending } from './sortRecords.js'
import { sampleAuditLogs } from './sampleAuditLogs.js'

const sections = [
  { id: 'overview', title: 'Tổng quan', page: DashboardPage },
  { id: 'cohorts', title: 'Khóa tuyển sinh', page: CohortsPage },
  { id: 'students', title: 'Sinh viên', page: StudentsPage },
  { id: 'activities', title: 'Hoạt động', page: ActivitiesPage },
  { id: 'participations', title: 'Lượt tham gia', page: ParticipationsPage },
  { id: 'certificates', title: 'Chứng nhận', page: CertificatesPage },
  { id: 'imports', title: 'Nhập dữ liệu Excel', page: ImportsPage },
  { id: 'audit', title: 'Nhật ký hệ thống', page: AuditLogsPage },
]

function subscribeToHash(callback) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

function getPreviewLocation() {
  return window.location.hash
}

export default function App() {
  const previewLocation = useSyncExternalStore(subscribeToHash, getPreviewLocation)
  const [managementRole, setManagementRole] = useState('')
  const showStudentPreview = previewLocation === '#sinh-vien' || (previewLocation === '#quan-tri-mau' && !managementRole)
  const [activeSectionId, setActiveSectionId] = useState('overview')
  const [cohorts, setCohorts] = useState(sampleCohorts)
  const [students, setStudents] = useState(sampleStudents)
  const [participations, setParticipations] = useState(sampleParticipations)
  const [certificates, setCertificates] = useState(sampleCertificates)
  const [importHistory, setImportHistory] = useState(sampleImportHistory)
  const [activities, setActivities] = useState(sampleActivities)
  const [auditLogs, setAuditLogs] = useState(sampleAuditLogs)
  const [notifications, setNotifications] = useState([])
  const activeSection = sections.find((section) => section.id === activeSectionId)
  const ActivePage = activeSection.page

  function startManagementPreview(role) {
    setManagementRole(role)
    setActiveSectionId('overview')
    window.location.hash = 'quan-tri-mau'
  }

  function endManagementPreview() {
    setManagementRole('')
    window.location.hash = 'sinh-vien'
  }

  function addNotifications(entries) {
    if (entries.length === 0) return
    const createdAt = new Date().toISOString()
    setNotifications((current) => {
      let nextId = (current[0]?.notificationId ?? 0) + entries.length
      const added = entries.map((entry) => ({
        ...entry,
        notificationId: nextId--,
        createdAt,
        isRead: false,
        readAt: null,
      }))
      return [...added, ...current]
    })
  }

  function markNotificationRead(notificationId, studentId) {
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((item) => (
      item.notificationId === notificationId && item.studentId === studentId && !item.isRead
        ? { ...item, isRead: true, readAt }
        : item
    )))
  }

  function appendAuditLogs(entries) {
    if (entries.length === 0) return
    const timestamp = new Date().toISOString()
    setAuditLogs((current) => {
      let nextId = Math.max(0, ...current.map((item) => item.auditLogId))
      return [...entries.map((entry) => ({
        ...entry,
        auditLogId: ++nextId,
        timestamp,
        actorUserId: null,
        actorLabel: 'Admin (mô phỏng)',
      })), ...current]
    })
  }

  function addCohort({ cohortCode, cohortName }) {
    setCohorts((current) => {
      const cohortId = Math.max(0, ...current.map((item) => item.cohortId)) + 1
      return [{ cohortId, cohortCode, cohortName, isActive: true }, ...current]
    })
  }

  function updateCohort(cohortId, changes) {
    setCohorts((current) => current.map((cohort) => (
      cohort.cohortId === cohortId ? { ...cohort, ...changes } : cohort
    )))
  }

  function addActivity(activity) {
    setActivities((current) => [
      { ...activity, activityId: Math.max(0, ...current.map((item) => item.activityId)) + 1 },
      ...current,
    ])
  }

  function updateActivity(activityId, changes) {
    setActivities((current) => current.map((activity) => (
      activity.activityId === activityId ? { ...activity, ...changes } : activity
    )))
  }

  function reviewParticipation(participationId, approvalStatus, reason = '') {
    return reviewParticipationBatch([participationId], approvalStatus, reason)[0]
  }

  function reviewParticipationBatch(participationIds, approvalStatus, reason = '') {
    const result = reviewParticipations(participations, participationIds, approvalStatus, reason)
    setParticipations(result.participations)
    const logEntries = result.results.map((item) => {
      const participation = participations.find((entry) => entry.participationId === item.participationId)
      const student = students.find((entry) => entry.studentId === participation?.studentId)
      const activity = activities.find((entry) => entry.activityId === participation?.activityId)
      return {
        action: approvalStatus === 'Rejected' ? 'Từ chối lượt tham gia' : 'Duyệt lượt tham gia',
        entityType: 'ActivityParticipations',
        entityId: String(item.participationId),
        outcome: item.success ? 'Success' : 'Failure',
        reason: `${student?.studentCode ?? '—'} · ${student?.fullName ?? 'Chưa xác định'} · ${activity?.code ?? '—'}. ${item.message}${item.success && approvalStatus === 'Rejected' ? ' Lý do: ' + reason.trim() : ''}`,
      }
    })
    if (approvalStatus === 'Approved') {
      const approvedIds = result.results.filter((item) => item.success).map((item) => item.participationId)
      const queued = queueCertificates(certificates, result.participations, approvedIds, activities, sampleCertificateTemplates)
      setCertificates(queued)
      const existingIds = new Set(certificates.map((item) => item.certificateId))
      logEntries.push(...queued.filter((item) => !existingIds.has(item.certificateId)).map((item) => ({
        action: 'Tạo yêu cầu chứng nhận', entityType: 'Certificates', entityId: item.certificateCode,
        outcome: item.status === 'Failed' ? 'Failure' : 'Success',
        reason: item.lastError ?? 'Đã thêm vào hàng đợi mô phỏng, chưa tạo PDF thật.',
      })))
    }
    appendAuditLogs(logEntries)
    const reviewNotifications = result.results.flatMap((item) => {
      if (!item.success) return []
      const participation = participations.find((entry) => entry.participationId === item.participationId)
      if (!participation) return []
      const activity = activities.find((entry) => entry.activityId === participation.activityId)
      const activityName = activity?.name ?? 'hoạt động'
      const rejected = approvalStatus === 'Rejected'
      return [{
        studentId: participation.studentId,
        title: rejected ? 'Lượt tham gia bị từ chối' : 'Lượt tham gia đã được duyệt',
        message: rejected
          ? `Lượt tham gia ${activityName} bị từ chối. Lý do: ${reason.trim()}`
          : `Lượt tham gia ${activityName} đã được duyệt. Bạn sẽ nhận thông báo khi chứng nhận được phát hành.`,
      }]
    })
    addNotifications(reviewNotifications)
    return result.results.map((item) => item.success && approvalStatus === 'Approved'
      ? { ...item, message: 'Đã duyệt. Xem trạng thái PDF tại trang Chứng nhận.' }
      : item)
  }

  function handleProcessCertificate(certificateId, action, reason = '') {
    const result = processCertificate(certificates, certificateId, action, participations, activities, sampleCertificateTemplates, reason)
    if (result.success) setCertificates(result.certificates)
    const certificate = result.certificates.find((item) => item.certificateId === certificateId)
    if (result.success && ['Issued', 'Revoked'].includes(certificate?.status)) {
      const participation = participations.find((item) => item.participationId === certificate.participationId)
      const activity = activities.find((item) => item.activityId === participation?.activityId)
      const revoked = certificate.status === 'Revoked'
      if (participation) {
        addNotifications([{
          studentId: participation.studentId,
          title: revoked ? 'Chứng nhận đã bị thu hồi' : 'Chứng nhận đã được phát hành (mô phỏng)',
          message: revoked
            ? `Chứng nhận ${certificate.certificateCode} đã bị thu hồi. Lý do: ${certificate.revocationReason}`
            : `Chứng nhận ${certificate.certificateCode} cho hoạt động ${activity?.name ?? 'chưa xác định'} đã được phát hành trong bản mô phỏng.`,
        }])
      }
    }
    appendAuditLogs([{
      action: action === 'revoke' ? 'Thu hồi chứng nhận' : action === 'retry' ? 'Thử lại chứng nhận' : 'Xử lý PDF mô phỏng',
      entityType: 'Certificates', entityId: certificate?.certificateCode ?? String(certificateId),
      outcome: !result.success || certificate?.status === 'Failed' ? 'Failure' : 'Success',
      reason: result.message,
    }])
    return { success: result.success, message: result.message }
  }

  function importStudentPreview(preview) {
    const knownCodes = new Set(students.map(({ studentCode }) => studentCode))
    let nextId = Math.max(0, ...students.map(({ studentId }) => studentId))
    const addedStudents = []
    const rows = preview.rows.map((row) => {
      if (row.processingStatus !== 'Valid') return row
      if (knownCodes.has(row.studentCode)) {
        return { ...row, processingStatus: 'Skipped', errorMessage: 'MSSV đã có trong danh sách sinh viên.' }
      }
      const cohort = cohorts.find((item) => item.cohortCode.toUpperCase() === row.cohortCode)
      if (!cohort?.isActive) {
        return { ...row, processingStatus: 'Error', errorMessage: 'Khóa tuyển sinh không tồn tại hoặc đã ngừng sử dụng.' }
      }
      knownCodes.add(row.studentCode)
      nextId += 1
      addedStudents.push({
        studentId: nextId,
        studentCode: row.studentCode,
        fullName: row.fullName,
        email: row.email || null,
        className: row.className || null,
        cohortId: cohort.cohortId,
        userId: null,
      })
      return { ...row, processingStatus: 'Imported' }
    })
    setStudents((current) => [...addedStudents, ...current])
    return completeImport(preview, rows, 'Students')
  }

  function completeImport(preview, rows, importType) {
    const batch = {
      batchId: Math.max(0, ...importHistory.map(({ batchId }) => batchId)) + 1,
      fileName: preview.fileName,
      importType,
      activityId: importType === 'Participations' ? preview.activityId : null,
      importedAt: new Date().toISOString(),
      totalRows: rows.length,
      successRows: rows.filter(({ processingStatus }) => processingStatus === 'Imported').length,
      duplicateRows: 0,
      skippedRows: rows.filter(({ processingStatus }) => processingStatus === 'Skipped').length,
      errorRows: rows.filter(({ processingStatus }) => processingStatus === 'Error').length,
      batchStatus: 'Completed',
    }
    setImportHistory((current) => [batch, ...current])
    appendAuditLogs([{
      action: importType === 'Students' ? 'Nhập hồ sơ sinh viên' : 'Nhập lượt tham gia',
      entityType: 'ImportBatches', entityId: String(batch.batchId),
      outcome: batch.successRows === 0 ? 'Failure' : batch.errorRows > 0 || batch.skippedRows > 0 ? 'Partial' : 'Success',
      reason: `${batch.fileName}: ${batch.successRows} dòng thành công, ${batch.skippedRows} dòng bỏ qua, ${batch.errorRows} dòng lỗi.`,
    }])
    return { ...preview, rows, confirmed: true, batch }
  }

  function importParticipationPreview(preview) {
    const activity = activities.find(({ activityId }) => activityId === preview.activityId)
    const knownIds = new Set(participations
      .filter(({ activityId }) => activityId === preview.activityId)
      .map(({ studentId }) => studentId))
    const addedParticipations = []
    let nextId = Math.max(0, ...participations.map(({ participationId }) => participationId))
    const rows = preview.rows.map((row) => {
      if (row.processingStatus !== 'Valid') return row
      const student = students.find(({ studentCode }) => studentCode === row.studentCode)
      if (!activity || !student) {
        return { ...row, processingStatus: 'Error', errorMessage: 'Không tìm thấy hoạt động hoặc hồ sơ sinh viên.' }
      }
      if (knownIds.has(student.studentId)) {
        return { ...row, processingStatus: 'Skipped', errorMessage: 'Sinh viên đã có lượt tham gia trong hoạt động này.' }
      }
      knownIds.add(student.studentId)
      nextId += 1
      addedParticipations.push({
        participationId: nextId,
        activityId: activity.activityId,
        studentId: student.studentId,
        approvalStatus: 'Pending',
      })
      return { ...row, processingStatus: 'Imported' }
    })
    setParticipations((current) => [...addedParticipations, ...current])
    return completeImport(preview, rows, 'Participations')
  }

  if (showStudentPreview) {
    return (
      <StudentPortal students={students} cohorts={cohorts} activities={activities} participations={participations}
        certificates={certificates} notifications={notifications} onReadNotification={markNotificationRead}
        onManagementSignIn={startManagementPreview} />
    )
  }

  if (previewLocation === '#quan-tri-mau' && managementRole === 'superAdmin') {
    return (
      <AdminLayout sections={[]} roleLabel="Super Admin · Bản xem thử" onDemoSignOut={endManagementPreview}>
        <h1 className="page-title">Super Admin</h1>
        <p className="text-body-secondary">Khu vực xem thử sau khi đăng nhập. Quản lý tài khoản và phân quyền chưa được tích hợp.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      sections={sections}
      activeSectionId={activeSectionId}
      onSelectSection={setActiveSectionId}
      roleLabel="Admin cấp chứng nhận"
      onDemoSignOut={previewLocation === '#quan-tri-mau' ? endManagementPreview : undefined}
    >
      {ActivePage ? (
        <ActivePage
          students={students}
          auditLogs={auditLogs}
          participations={participations}
          certificates={certificates}
          onProcessCertificate={handleProcessCertificate}
          onReviewParticipation={reviewParticipation}
          onReviewParticipations={reviewParticipationBatch}
          onImportParticipations={importParticipationPreview}
          importHistory={importHistory}
          onImportStudents={importStudentPreview}
          activities={[...activities].sort((left, right) => compareCodesDescending(left.code, right.code))}
          onAddActivity={addActivity}
          onUpdateActivity={updateActivity}
          cohorts={[...cohorts].sort((left, right) => compareCodesDescending(left.cohortCode, right.cohortCode))}
          onAddCohort={addCohort}
          onUpdateCohort={updateCohort}
        />
      ) : (
        <>
          <h1 className="page-title mb-4">{activeSection.title}</h1>
          <div className="card content-card">
            <div className="card-body p-4">
              <p className="text-body-secondary mb-0">
                {activeSection.description ?? 'Mục này đang được xây dựng.'}
              </p>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
