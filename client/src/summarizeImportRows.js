export function summarizeImportRows(rows) {
  const counts = { totalRows: rows.length, validRows: 0, successRows: 0, duplicateRows: 0, skippedRows: 0, errorRows: 0 }
  for (const { processingStatus, isDuplicate } of rows) {
    if (processingStatus === 'Valid') counts.validRows += 1
    if (processingStatus === 'Imported') counts.successRows += 1
    if (processingStatus === 'Error') counts.errorRows += 1
    if (processingStatus === 'Skipped') {
      if (isDuplicate) counts.duplicateRows += 1
      else counts.skippedRows += 1
    }
  }
  return counts
}
