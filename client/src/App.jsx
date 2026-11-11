import { useState, useSyncExternalStore } from 'react'
import AdminLayout from './AdminLayout.jsx'
import ActivitiesPage from './ActivitiesPage.jsx'
import AuditLogsPage from './AuditLogsPage.jsx'
import CertificateTemplatesPage from './CertificateTemplatesPage.jsx'
import CertificatesPage from './CertificatesPage.jsx'
import CertificateVerification from './CertificateVerification.jsx'
import CohortsPage from './CohortsPage.jsx'
import DashboardPage from './DashboardPage.jsx'
import ImportsPage from './ImportsPage.jsx'
import StudentPortal from './StudentPortal.jsx'
import { demoStudentActivation } from './demoStudentActivation.js'
import SuperAdminAccounts from './SuperAdminAccounts.jsx'
import ParticipationsPage from './ParticipationsPage.jsx'
import StudentsPage from './StudentsPage.jsx'
import { sampleCohorts } from './sampleCohorts.js'
import { sampleActivities } from './sampleActivities.js'
import { sampleStudents } from './sampleStudents.js'
import { sampleParticipations } from './sampleParticipations.js'
import { sampleImportHistory } from './sampleImportHistory.js'
import { summarizeImportRows } from './summarizeImportRows.js'
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

const superAdminSections = [
  { id: 'workspace', title: 'Khu quản trị' },
  { id: 'accounts', title: 'Quản lý tài khoản' },
  { id: 'templates', title: 'Mẫu chứng nhận' },
  { id: 'audit', title: 'Nhật ký hệ thống' },
]
const superAdminWorkspaceSections = [
  { id: 'back-to-super-admin', title: 'Về Super Admin' },
  ...sections,
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
  const [previewRoute, previewQuery] = previewLocation.split('?', 2)
  const showVerification = previewRoute === '#tra-cuu'
  const [managementRole, setManagementRole] = useState('')
  const [adminLocked, setAdminLocked] = useState(false)
  const [superAdminSection, setSuperAdminSection] = useState('accounts')
  const inSuperAdmin = previewLocation === '#quan-tri-mau' && managementRole === 'superAdmin'
  const showStudentPreview = previewLocation === '#sinh-vien'
    || (previewLocation === '#quan-tri-mau' && !managementRole)
    || (adminLocked && !inSuperAdmin)
  const [activeSectionId, setActiveSectionId] = useState('overview')
  const [cohorts, setCohorts] = useState(sampleCohorts)
  const [students, setStudents] = useState(sampleStudents)
  const [participations, setParticipations] = useState(sampleParticipations)
  const [certificates, setCertificates] = useState(sampleCertificates)
  const [templates, setTemplates] = useState(sampleCertificateTemplates)
  const [importHistory, setImportHistory] = useState(sampleImportHistory)
  const [activities, setActivities] = useState(sampleActivities)
  const [auditLogs, setAuditLogs] = useState(sampleAuditLogs)
  const [notifications, setNotifications] = useState([])
  const activeSection = sections.find((section) => section.id === activeSectionId)
  const ActivePage = activeSection.page

  function activateDemoStudent(studentCode, activationCode) {
    const student = students.find((item) => item.studentCode === studentCode)
    if (!student || studentCode !== demoStudentActivation.studentCode
      || activationCode !== demoStudentActivation.activationCode) {
      return { error: 'MSSV hoặc mã kích hoạt mẫu không đúng.' }
    }
    if (student.userId) return { error: 'Tài khoản này đã được kích hoạt trong phiên.' }

    setStudents((current) => current.map((item) => (
      item.studentId === student.studentId && !item.userId
        ? { ...item, userId: 'demo-activated-' + item.studentId }
        : item
    )))
    return { error: '' }
  }

  function startManagementPreview(role) {
    if (role === 'admin' && adminLocked) return false
    setManagementRole(role)
    setActiveSectionId('overview')
    setSuperAdminSection('accounts')
    window.location.hash = 'quan-tri-mau'
    return true
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
    const actorLabel = inSuperAdmin ? 'Super Admin (mô phỏng)' : 'Admin (mô phỏng)'
    setAuditLogs((current) => {
      let nextId = Math.max(0, ...current.map((item) => item.auditLogId))
      return [...entries.map((entry) => ({
        ...entry,
        auditLogId: ++nextId,
        timestamp,
        actorUserId: null,
        actorLabel,
      })), ...current]
    })
  }

  function updateAdminLock(locked) {
    if (!inSuperAdmin || adminLocked === locked) return
    setAdminLocked(locked)
    appendAuditLogs([{
      action: locked ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      entityType: 'Accounts',
      entityId: 'admin',
      outcome: 'Success',
      reason: locked ? 'Đã khóa tài khoản Admin mẫu.' : 'Đã mở khóa tài khoản Admin mẫu.',
    }])
  }

  function updateStudentLock(studentId, locked) {
    const student = students.find((item) => item.studentId === studentId)
    if (!inSuperAdmin || !student?.userId || Boolean(student.accountDisabled) === locked) return

    setStudents((current) => current.map((item) => item.studentId === studentId
      ? { ...item, accountDisabled: locked }
      : item))
    appendAuditLogs([{
      action: locked ? 'Khóa tài khoản' : 'Mở khóa tài khoản',
      entityType: 'Accounts',
      entityId: student.studentCode,
      outcome: 'Success',
      reason: student.fullName,
    }])
  }

  function addCertificateTemplate(name, templateFile, fieldPositions) {
    const templateName = name.trim()
    if (!inSuperAdmin || !templateFile || !templateName) return 'Nhập tên và chọn tệp mẫu.'
    const nameKey = templateName.toLocaleLowerCase('vi-VN')
    if (templates.some((item) => item.templateName.toLocaleLowerCase('vi-VN') === nameKey)) {
      return 'Tên mẫu đã tồn tại. Hãy chọn tên khác.'
    }

    const templateId = Math.max(0, ...templates.map((item) => item.templateId)) + 1
    setTemplates((current) => [...current, { templateId, templateName, templateFile, fieldPositions, version: 1, isActive: true, isDefault: false }])
    appendAuditLogs([{
      action: 'Thêm mẫu chứng nhận',
      entityType: 'CertificateTemplates',
      entityId: String(templateId),
      outcome: 'Success',
      reason: templateName,
    }])
    return ''
  }

  function addCertificateTemplateVersion(templateId, templateFile, fieldPositions) {
    const template = templates.find((item) => item.templateId === templateId)
    if (!inSuperAdmin || !template || !templateFile) return 'Không tìm thấy mẫu hoặc tệp phiên bản mới.'

    const version = template.version + 1
    setTemplates((current) => current.map((item) => item.templateId === templateId ? {
      ...item,
      version,
      templateFile,
      fieldPositions,
      previousVersions: [...(item.previousVersions ?? []), {
        version: item.version, templateFile: item.templateFile, fieldPositions: item.fieldPositions,
      }],
    } : item))
    appendAuditLogs([{
      action: 'Thêm phiên bản mẫu',
      entityType: 'CertificateTemplates',
      entityId: String(templateId),
      outcome: 'Success',
      reason: `${template.templateName} · v${version}`,
    }])
    return ''
  }

  function updateCertificateTemplateStatus(templateId, isActive) {
    const template = templates.find((item) => item.templateId === templateId)
    if (!inSuperAdmin || !template) return 'Không tìm thấy mẫu chứng nhận.'
    if (!isActive && template.isDefault) return 'Chọn mẫu mặc định khác trước khi ngừng sử dụng mẫu này.'
    if (template.isActive === isActive) return ''

    setTemplates((current) => current.map((item) => item.templateId === templateId ? { ...item, isActive } : item))
    appendAuditLogs([{
      action: isActive ? 'Sử dụng lại mẫu' : 'Ngừng sử dụng mẫu',
      entityType: 'CertificateTemplates',
      entityId: String(templateId),
      outcome: 'Success',
      reason: template.templateName,
    }])
    return ''
  }

  function setDefaultCertificateTemplate(templateId) {
    const template = templates.find((item) => item.templateId === templateId)
    if (!inSuperAdmin || !template?.isActive || template.isDefault) return

    setTemplates((current) => current.map((item) => ({
      ...item,
      isDefault: item.templateId === templateId,
    })))
    appendAuditLogs([{
      action: 'Đổi mẫu mặc định',
      entityType: 'CertificateTemplates',
      entityId: String(templateId),
      outcome: 'Success',
      reason: `${template.templateName} · Phiên bản ${template.version}`,
    }])
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
      const queued = queueCertificates(certificates, result.participations, approvedIds, activities, templates)
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
    const result = processCertificate(certificates, certificateId, action, participations, activities, templates, reason)
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
        return { ...row, processingStatus: 'Skipped', isDuplicate: true, errorMessage: 'MSSV đã có trong danh sách sinh viên.' }
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
        isActive: true,
      })
      return { ...row, processingStatus: 'Imported' }
    })
    setStudents((current) => [...addedStudents, ...current])
    return completeImport(preview, rows, 'Students')
  }

  function completeImport(preview, rows, importType) {
    const { totalRows, successRows, duplicateRows, skippedRows, errorRows } = summarizeImportRows(rows)
    const batch = {
      batchId: Math.max(0, ...importHistory.map(({ batchId }) => batchId)) + 1,
      fileName: preview.fileName,
      importType,
      activityId: importType === 'Participations' ? preview.activityId : null,
      importedAt: new Date().toISOString(),
      totalRows,
      successRows,
      duplicateRows,
      skippedRows,
      errorRows,
      batchStatus: 'Completed',
    }
    setImportHistory((current) => [batch, ...current])
    appendAuditLogs([{
      action: importType === 'Students' ? 'Nhập hồ sơ sinh viên' : 'Nhập lượt tham gia',
      entityType: 'ImportBatches', entityId: String(batch.batchId),
      outcome: successRows === 0 ? 'Failure' : successRows < totalRows ? 'Partial' : 'Success',
      reason: `${batch.fileName}: ${successRows} dòng thành công, ${duplicateRows} dòng trùng, ${skippedRows} dòng bỏ qua, ${errorRows} dòng lỗi.`,
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
        return { ...row, processingStatus: 'Skipped', isDuplicate: true, errorMessage: 'Sinh viên đã có lượt tham gia trong hoạt động này.' }
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

  if (showStudentPreview || showVerification) {
    const initialCode = new URLSearchParams(previewQuery).get('ma') ?? ''
    return (
      <>
        <div hidden={showVerification}>
          <StudentPortal students={students} cohorts={cohorts} activities={activities} participations={participations}
            certificates={certificates} notifications={notifications} onReadNotification={markNotificationRead}
            onManagementSignIn={startManagementPreview} onActivateDemoStudent={activateDemoStudent}
            adminPreviewAvailable={!adminLocked} />
        </div>
        {showVerification && (
          <CertificateVerification key={initialCode} initialCode={initialCode} certificates={certificates}
            participations={participations} activities={activities} />
        )}
      </>
    )
  }

  if (inSuperAdmin && superAdminSection !== 'workspace') {
    return (
      <AdminLayout key="super-admin" sections={superAdminSections}
        activeSectionId={superAdminSection} onSelectSection={(sectionId) => {
          if (sectionId === 'workspace') setActiveSectionId('overview')
          setSuperAdminSection(sectionId)
        }} roleLabel="Super Admin · Bản xem thử"
        accountIdentifier="superadmin" onDemoSignOut={endManagementPreview}>
        {superAdminSection === 'accounts' && (
          <SuperAdminAccounts students={students} adminLocked={adminLocked}
            onUpdateAdminLock={updateAdminLock} onUpdateStudentLock={updateStudentLock} />
        )}
        {superAdminSection === 'templates' && (
          <CertificateTemplatesPage templates={templates} onSetDefault={setDefaultCertificateTemplate}
            onAddTemplate={addCertificateTemplate} onAddVersion={addCertificateTemplateVersion}
            onUpdateStatus={updateCertificateTemplateStatus} />
        )}
        {superAdminSection === 'audit' && <AuditLogsPage auditLogs={auditLogs} />}
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      key={inSuperAdmin ? 'super-admin' : 'admin'}
      sections={inSuperAdmin ? superAdminWorkspaceSections : sections}
      activeSectionId={activeSectionId}
      onSelectSection={(sectionId) => {
        if (sectionId === 'back-to-super-admin') setSuperAdminSection('accounts')
        else setActiveSectionId(sectionId)
      }}
      roleLabel={inSuperAdmin ? 'Super Admin · Khu quản trị' : 'Admin cấp chứng nhận'}
      accountIdentifier={inSuperAdmin ? 'superadmin' : 'admin'}
      onDemoSignOut={endManagementPreview}
    >
      {ActivePage ? (
        <ActivePage
          students={students}
          auditLogs={auditLogs}
          participations={participations}
          certificates={certificates}
          templates={templates}
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
