import { summarizeDashboard } from './summarizeDashboard.js'
import { certificateStatuses } from './certificateStatuses.js'
import { createParticipationComparator } from './sortRecords.js'

const approvalLabels = { Pending: 'Chờ duyệt', Approved: 'Đã duyệt', Rejected: 'Từ chối' }
const blue = 'FF2F5FC4'
const paleBlue = 'FFF0F4FC'
const dateLabel = (value) => value ? value.split('-').reverse().join('/') : ''

function setupSheet(sheet, widths) {
  sheet.columns = widths.map((width) => ({ width }))
  sheet.properties.defaultRowHeight = 28
  sheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }]
  sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
}

function styleHeader(row) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: blue } }
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
  row.height = 32
}

function styleBody(row, shaded = false) {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF172235' } }
    cell.alignment = { vertical: 'middle', wrapText: true }
    if (shaded) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: paleBlue } }
  })
}

export async function createDashboardReport({ cohorts, students, activities, participations, certificates, filters, metrics }) {
  const { default: ExcelJS } = await import('exceljs')
  const summary = summarizeDashboard({ cohorts, students, activities, participations, certificates, ...filters })
  const workbook = new ExcelJS.Workbook()
  const createdAt = new Date()
  workbook.creator = 'Student Cert Hub'
  workbook.created = createdAt
  const cohort = cohorts.find((item) => String(item.cohortId) === filters.selectedCohort)
  const activity = activities.find((item) => String(item.activityId) === filters.selectedActivity)
  const period = filters.fromDate && filters.toDate ? `${dateLabel(filters.fromDate)} – ${dateLabel(filters.toDate)}`
    : filters.fromDate ? `Từ ${dateLabel(filters.fromDate)}` : filters.toDate ? `Đến ${dateLabel(filters.toDate)}` : 'Toàn bộ thời gian'

  const overview = workbook.addWorksheet('Tổng quan')
  setupSheet(overview, [14, 36, 24, 24])
  overview.pageSetup.orientation = 'portrait'
  overview.mergeCells('A1:D1')
  overview.getCell('A1').value = 'BÁO CÁO TỔNG QUAN'
  styleHeader(overview.getRow(1))
  overview.getCell('A1').font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
  overview.getRow(1).height = 40
  overview.mergeCells('A2:D2')
  overview.getCell('A2').value = 'Student Cert Hub · Dữ liệu mẫu'
  styleBody(overview.getRow(2))
  overview.getCell('A2').font = { name: 'Calibri', size: 10, color: { argb: 'FF68768A' } }

  const scope = [
    ['Thời điểm xuất', createdAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
    ['Khóa tuyển sinh', cohort?.cohortCode ?? 'Tất cả khóa'],
    ['Hoạt động', activity ? `${activity.code} · ${activity.name}` : 'Tất cả hoạt động'],
    ['Ngày tổ chức', period],
  ]
  scope.forEach(([label, value], index) => {
    const row = index + 4
    overview.mergeCells(`A${row}:B${row}`)
    overview.mergeCells(`C${row}:D${row}`)
    overview.getCell(`A${row}`).value = label
    overview.getCell(`C${row}`).value = value
    styleBody(overview.getRow(row))
    overview.getCell(`A${row}`).font = { name: 'Calibri', size: 11, bold: true }
    overview.getRow(row).height = Math.max(28, Math.ceil(value.length / 42) * 16 + 8)
  })

  overview.mergeCells('A9:B9')
  overview.mergeCells('C9:D9')
  overview.getCell('A9').value = 'Chỉ số'
  overview.getCell('C9').value = 'Số lượng'
  styleHeader(overview.getRow(9))
  const reportMetrics = [...metrics.map(([label, value]) => [label, value]), ['Chứng nhận đang tạo', summary.certificateCounts.Generating]]
  reportMetrics.forEach(([label, value], index) => {
    const row = index + 10
    overview.mergeCells(`A${row}:B${row}`)
    overview.mergeCells(`C${row}:D${row}`)
    overview.getCell(`A${row}`).value = label
    overview.getCell(`C${row}`).value = value
    styleBody(overview.getRow(row), index % 2 === 0)
    overview.getCell(`C${row}`).alignment = { horizontal: 'center', vertical: 'middle' }
    overview.getCell(`C${row}`).numFmt = '#,##0'
  })

  overview.mergeCells('A19:D19')
  overview.getCell('A19').value = 'THAM GIA THEO KHÓA'
  styleHeader(overview.getRow(19))
  overview.getRow(20).values = ['Khóa', 'Hồ sơ sinh viên', 'Sinh viên có lượt', 'Tỷ lệ tham gia']
  styleBody(overview.getRow(20), true)
  overview.getRow(20).font = { name: 'Calibri', size: 11, bold: true }
  summary.cohortParticipation.forEach((item, index) => {
    const row = overview.getRow(index + 21)
    row.values = [
      cohorts.find((entry) => entry.cohortId === item.cohortId)?.cohortCode ?? String(item.cohortId),
      item.studentCount, item.uniqueStudents, item.studentCount ? item.uniqueStudents / item.studentCount : 0,
    ]
    styleBody(row, index % 2 !== 0)
    row.getCell(4).numFmt = '0.0%'
  })
  const noteRow = 22 + summary.cohortParticipation.length
  overview.mergeCells(`A${noteRow}:D${noteRow}`)
  overview.getCell(`A${noteRow}`).value = 'Tỷ lệ = sinh viên có lượt tham gia / hồ sơ sinh viên của khóa. Trạng thái chứng nhận tính tại thời điểm xuất.'
  styleBody(overview.getRow(noteRow))
  overview.getCell(`A${noteRow}`).font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF68768A' } }
  overview.getRow(noteRow).height = 32

  const detail = workbook.addWorksheet('Lượt tham gia')
  setupSheet(detail, [7, 16, 28, 11, 40, 20, 32, 22, 19])
  detail.addRow(['STT', 'MSSV', 'Họ và tên', 'Khóa', 'Hoạt động', 'Trạng thái duyệt', 'Mã chứng nhận', 'Trạng thái chứng nhận', 'Ngày phát hành'])
  styleHeader(detail.getRow(1))
  detail.getRow(1).height = 36
  summary.scopedParticipations.sort(createParticipationComparator(cohorts, activities, students)).forEach((participation, index) => {
    const student = students.find((item) => item.studentId === participation.studentId)
    const event = activities.find((item) => item.activityId === participation.activityId)
    const certificate = certificates.find((item) => item.participationId === participation.participationId)
    const eventLabel = `${event.code} · ${event.name}`
    const row = detail.addRow([
      index + 1, String(student.studentCode), student.fullName,
      cohorts.find((item) => item.cohortId === student.cohortId)?.cohortCode ?? '', eventLabel,
      approvalLabels[participation.approvalStatus] ?? participation.approvalStatus,
      certificate?.certificateCode ?? null, certificateStatuses.find((item) => item.status === certificate?.status)?.label ?? 'Chưa có chứng nhận',
      certificate?.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : null,
    ])
    styleBody(row, index % 2 === 0)
    const lineCount = (value, width) => String(value).split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / width)), 0)
    row.height = Math.max(30, Math.max(lineCount(student.fullName, 25), lineCount(eventLabel, 36), lineCount(certificate?.certificateCode ?? '', 28)) * 16 + 8)
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' }
  })
  detail.getColumn(2).numFmt = '@'
  detail.autoFilter = { from: 'A1', to: `I${detail.rowCount}` }
  detail.pageSetup.printTitlesRow = '1:1'
  const dateName = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(createdAt)
  return { buffer: await workbook.xlsx.writeBuffer(), fileName: `bao-cao-tong-quan-${dateName}.xlsx` }
}
