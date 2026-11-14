import { readImportFile, importHeaderKey } from './readImportFile.js'

const requiredHeaders = ['MSSV', 'Họ và tên', 'Mã khóa tuyển sinh']

export async function previewStudentFile(file, cohorts, students) {
  const rows = await readImportFile(file)
  const headers = rows[0].values.map(importHeaderKey)
  const missing = requiredHeaders.filter((header) => !headers.includes(importHeaderKey(header)))
  if (missing.length) throw new Error('Thiếu cột: ' + missing.join(', ') + '.')
  if (new Set(headers).size !== headers.length) throw new Error('Tên cột bị trùng. Mỗi cột cần có tên riêng.')
  const knownStudents = new Set(students.map(({ studentCode }) => studentCode))
  const seen = new Set()
  return rows.slice(1).map(({ rowNumber, values, hasFormula }) => {
    const read = (header) => String(values[headers.indexOf(importHeaderKey(header))] ?? '').trim()
    const studentCode = read('MSSV')
    const fullName = read('Họ và tên')
    const cohortCode = read('Mã khóa tuyển sinh').toUpperCase()
    const email = read('Email')
    const className = read('Lớp')
    const cohort = cohorts.find((item) => item.cohortCode.toUpperCase() === cohortCode)
    const errors = []
    if (hasFormula) errors.push('Dòng có công thức. Hãy thay bằng giá trị.')
    if (!studentCode) errors.push('Thiếu MSSV.')
    else if (!/^\d{1,20}$/.test(studentCode)) errors.push('MSSV cần là chuỗi số, tối đa 20 ký tự.')
    if (!fullName || fullName.length > 150) errors.push('Họ tên bắt buộc, tối đa 150 ký tự.')
    if (!cohort) errors.push('Mã khóa tuyển sinh không tồn tại.')
    else if (!cohort.isActive) errors.push('Khóa tuyển sinh đã ngừng sử dụng.')
    if (email && (email.length > 256 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.push('Email không hợp lệ.')
    if (className.length > 50) errors.push('Lớp tối đa 50 ký tự.')
    let processingStatus = 'Valid'
    let errorMessage = null
    let isDuplicate = false
    if (errors.length) {
      processingStatus = 'Error'
      errorMessage = errors.join(' ')
    } else if (seen.has(studentCode) || knownStudents.has(studentCode)) {
      processingStatus = 'Skipped'
      isDuplicate = true
      errorMessage = seen.has(studentCode) ? 'MSSV trùng trong tệp.' : 'MSSV đã có trong danh sách sinh viên.'
    }
    if (errors.length === 0) seen.add(studentCode)
    return { rowNumber, studentCode, fullName, cohortCode, email, className, processingStatus, errorMessage, isDuplicate }
  })
}

