const codeCollator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' })
const nameCollator = new Intl.Collator('vi', { sensitivity: 'base' })

export function compareCodesDescending(left, right) {
  return codeCollator.compare(String(right ?? ''), String(left ?? ''))
}

export function compareStudentNames(left, right) {
  const leftName = String(left ?? '').normalize('NFC').trim().replace(/\s+/g, ' ')
  const rightName = String(right ?? '').normalize('NFC').trim().replace(/\s+/g, ' ')
  if (!leftName || !rightName) return leftName ? -1 : rightName ? 1 : 0
  return nameCollator.compare(leftName.split(' ').at(-1), rightName.split(' ').at(-1))
    || nameCollator.compare(leftName, rightName)
}

export function createStudentComparator(cohorts) {
  const cohortCodes = new Map(cohorts.map((item) => [item.cohortId, item.cohortCode]))
  return (left, right) => compareCodesDescending(cohortCodes.get(left.cohortId), cohortCodes.get(right.cohortId))
    || compareStudentNames(left.fullName, right.fullName)
    || compareCodesDescending(left.studentCode, right.studentCode)
}

export function createParticipationComparator(cohorts, activities, students) {
  const cohortCodes = new Map(cohorts.map((item) => [item.cohortId, item.cohortCode]))
  const activityCodes = new Map(activities.map((item) => [item.activityId, item.code]))
  const byStudentId = new Map(students.map((item) => [item.studentId, item]))
  return (left, right) => {
    const leftStudent = byStudentId.get(left?.studentId)
    const rightStudent = byStudentId.get(right?.studentId)
    return compareCodesDescending(cohortCodes.get(leftStudent?.cohortId), cohortCodes.get(rightStudent?.cohortId))
      || compareCodesDescending(activityCodes.get(left?.activityId), activityCodes.get(right?.activityId))
      || compareStudentNames(leftStudent?.fullName, rightStudent?.fullName)
      || compareCodesDescending(leftStudent?.studentCode, rightStudent?.studentCode)
      || (right?.participationId ?? 0) - (left?.participationId ?? 0)
  }
}
