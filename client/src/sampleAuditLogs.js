export const sampleAuditLogs = [
  { auditLogId: 1, timestamp: '2026-11-10T02:30:00Z', actorUserId: 'admin-demo', action: 'Nhập hồ sơ sinh viên', entityType: 'ImportBatches', entityId: '2', outcome: 'Partial', reason: '22 dòng thành công, 1 dòng bỏ qua, 1 dòng lỗi.' },
  { auditLogId: 2, timestamp: '2026-11-09T07:15:00Z', actorUserId: null, action: 'Tạo PDF chứng nhận', entityType: 'Certificates', entityId: 'CN-MAU-004', outcome: 'Failure', reason: 'Tạo tệp PDF thất bại.' },
  { auditLogId: 3, timestamp: '2026-10-26T03:00:00Z', actorUserId: 'admin-demo', action: 'Phát hành chứng nhận', entityType: 'Certificates', entityId: 'CN-MAU-001', outcome: 'Success', reason: null },
]
