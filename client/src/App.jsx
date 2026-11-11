import { useState } from 'react'
import AdminLayout from './AdminLayout.jsx'
import ActivitiesPage from './ActivitiesPage.jsx'
import AuditLogsPage from './AuditLogsPage.jsx'
import CertificatesPage from './CertificatesPage.jsx'
import CohortsPage from './CohortsPage.jsx'
import DashboardPage from './DashboardPage.jsx'
import ImportsPage from './ImportsPage.jsx'
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
import { queueCertificates } from './queueCertificates.js'

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

export default function App() {
  const [activeSectionId, setActiveSectionId] = useState('overview')
  const [cohorts, setCohorts] = useState(sampleCohorts)
  const [students, setStudents] = useState(sampleStudents)
  const [participations, setParticipations] = useState(sampleParticipations)
  const [certificates, setCertificates] = useState(sampleCertificates)
  const [importHistory, setImportHistory] = useState(sampleImportHistory)
  const [activities, setActivities] = useState(sampleActivities)
  const activeSection = sections.find((section) => section.id === activeSectionId)
  const ActivePage = activeSection.page

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
    if (approvalStatus === 'Approved') {
      const approvedIds = result.results.filter((item) => item.success).map((item) => item.participationId)
      setCertificates(queueCertificates(certificates, result.participations, approvedIds, activities, sampleCertificateTemplates))
    }
    return result.results.map((item) => item.success && approvalStatus === 'Approved'
      ? { ...item, message: 'Đã duyệt. Xem trạng thái PDF tại trang Chứng nhận.' }
      : item)
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

  return (
    <AdminLayout
      sections={sections}
      activeSectionId={activeSectionId}
      onSelectSection={setActiveSectionId}
      roleLabel="Admin cấp chứng nhận"
    >
      {ActivePage ? (
        <ActivePage
          students={students}
          participations={participations}
          certificates={certificates}
          onReviewParticipation={reviewParticipation}
          onReviewParticipations={reviewParticipationBatch}
          onImportParticipations={importParticipationPreview}
          importHistory={importHistory}
          onImportStudents={importStudentPreview}
          activities={activities}
          onAddActivity={addActivity}
          onUpdateActivity={updateActivity}
          cohorts={cohorts}
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
