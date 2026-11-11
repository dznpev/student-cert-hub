import { certificateStatuses } from './certificateStatuses.js'
import { compareCodesDescending } from './sortRecords.js'

export function summarizeDashboard({ cohorts, students, activities, participations, certificates, selectedCohort = '', selectedActivity = '', fromDate = '', toDate = '' }) {
  const scopedStudents = students.filter((item) => selectedCohort === '' || String(item.cohortId) === selectedCohort)
  const studentIds = new Set(scopedStudents.map((item) => item.studentId))
  const activityIds = new Set(activities.filter((item) => {
    if (selectedActivity !== '' && String(item.activityId) !== selectedActivity) return false
    if (!fromDate && !toDate) return true
    if (!item.startDate) return false
    const endDate = item.endDate || item.startDate
    return (!fromDate || endDate >= fromDate) && (!toDate || item.startDate <= toDate)
  }).map((item) => item.activityId))
  const scopedParticipations = participations.filter((item) => studentIds.has(item.studentId) && activityIds.has(item.activityId))
  const participationIds = new Set(scopedParticipations.map((item) => item.participationId))
  const participatingStudents = new Set(scopedParticipations.map((item) => item.studentId))
  const certificateCounts = Object.fromEntries(certificateStatuses.map(({ status }) => [status, 0]))
  for (const certificate of certificates) {
    if (participationIds.has(certificate.participationId) && Object.hasOwn(certificateCounts, certificate.status)) {
      certificateCounts[certificate.status] += 1
    }
  }
  return {
    studentCount: scopedStudents.length,
    activityCount: selectedCohort === '' ? activityIds.size : new Set(scopedParticipations.map((item) => item.activityId)).size,
    participationCount: scopedParticipations.length,
    uniqueStudents: participatingStudents.size,
    certificateCounts,
    scopedParticipations,
    cohortParticipation: cohorts
      .filter((item) => selectedCohort === '' || String(item.cohortId) === selectedCohort)
      .sort((left, right) => compareCodesDescending(left.cohortCode, right.cohortCode))
      .map((cohort) => {
        const cohortStudents = scopedStudents.filter((item) => item.cohortId === cohort.cohortId)
        return {
          cohortId: cohort.cohortId,
          studentCount: cohortStudents.length,
          uniqueStudents: cohortStudents.filter((item) => participatingStudents.has(item.studentId)).length,
        }
      }),
  }
}
