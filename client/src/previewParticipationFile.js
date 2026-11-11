import { readImportFile, importHeaderKey } from './readImportFile.js'

export async function previewParticipationFile(file, activityId, students, participations) {
  const rows = await readImportFile(file)
  const headers = rows[0].values.map(importHeaderKey)
  const codeIndex = headers.indexOf(importHeaderKey('MSSV'))
  if (codeIndex < 0) throw new Error('Thiếu cột: MSSV.')
  if (new Set(headers).size !== headers.length) throw new Error('Tên cột bị trùng.')
  const existingStudentIds = new Set(participations.filter((row) => row.activityId === activityId).map(({ studentId }) => studentId))
  const seen = new Set()
  return rows.slice(1).map(({ rowNumber, values, hasFormula }) => {
    const studentCode = String(values[codeIndex] ?? '').trim()
    const student = students.find((item) => item.studentCode === studentCode)
    let processingStatus = 'Valid'
    let errorMessage = null
    if (hasFormula) {
      processingStatus = 'Error'
      errorMessage = 'Dòng có công thức. Hãy thay bằng giá trị.'
    } else if (!studentCode) {
      processingStatus = 'Error'
      errorMessage = 'Thiếu MSSV.'
    } else if (!student) {
      processingStatus = 'Error'
      errorMessage = 'Không tìm thấy MSSV trong danh sách sinh viên.'
    } else if (seen.has(studentCode) || existingStudentIds.has(student.studentId)) {
      processingStatus = 'Skipped'
      errorMessage = seen.has(studentCode) ? 'MSSV trùng trong tệp.' : 'Sinh viên đã có lượt tham gia trong hoạt động này.'
    }
    if (student && processingStatus !== 'Error') seen.add(studentCode)
    return { rowNumber, studentCode, studentId: student?.studentId ?? null, fullName: student?.fullName ?? '', processingStatus, errorMessage }
  })
}

