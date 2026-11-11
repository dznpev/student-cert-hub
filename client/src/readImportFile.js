import { normalizeSearch } from './normalizeSearch.js'

export const importHeaderKey = (value) => normalizeSearch(String(value).trim().replace(/\s+/g, ' '))

export async function readImportFile(file) {
  if (!/\.(xlsx|csv)$/i.test(file.name)) throw new Error('Chọn tệp .xlsx hoặc .csv.')
  if (file.size > 5 * 1024 * 1024) throw new Error('Bản thử hỗ trợ tệp tối đa 5 MB.')
  let rows
  if (/\.csv$/i.test(file.name)) {
    const { default: Papa } = await import('papaparse')
    const result = Papa.parse(await file.text(), { skipEmptyLines: false, dynamicTyping: false })
    if (result.errors.some(({ code }) => code !== 'UndetectableDelimiter')) throw new Error('Tệp CSV sai định dạng. Kiểm tra dấu phân cách và dấu ngoặc kép.')
    rows = result.data.map((values, index) => ({ rowNumber: index + 1, values, hasFormula: false }))
  } else {
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    try {
      await workbook.xlsx.load(await file.arrayBuffer())
    } catch {
      throw new Error('Không đọc được tệp Excel. Kiểm tra tệp .xlsx rồi thử lại.')
    }
    const sheet = workbook.worksheets[0]
    if (!sheet) throw new Error('Tệp Excel chưa có sheet dữ liệu.')
    if (sheet.rowCount > 1001) throw new Error('Bản thử hỗ trợ tối đa 1.000 dòng dữ liệu.')
    rows = []
    sheet.eachRow((row, rowNumber) => {
      const values = []
      let hasFormula = false
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (cell.type === ExcelJS.ValueType.Formula) hasFormula = true
        let text = cell.text
        if (typeof cell.value === 'number' && /^0+$/.test(cell.numFmt)) text = String(cell.value).padStart(cell.numFmt.length, '0')
        values[colNumber - 1] = text
      })
      rows.push({ rowNumber, values, hasFormula })
    })
  }
  rows = rows.filter(({ values }) => values.some((value) => String(value ?? '').trim()))
  if (rows.length < 2) throw new Error('Tệp cần có hàng tiêu đề và ít nhất một dòng dữ liệu.')
  if (rows.length > 1001) throw new Error('Bản thử hỗ trợ tối đa 1.000 dòng dữ liệu.')
  return rows
}
