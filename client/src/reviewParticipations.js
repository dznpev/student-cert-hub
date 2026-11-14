export function reviewParticipations(participations, participationIds, approvalStatus, reason = '', actor = {}) {
  const rejectedReason = reason.trim()
  const byId = new Map(participations.map((item) => [item.participationId, item]))
  const results = [...new Set(participationIds)].map((participationId) => {
    const participation = byId.get(participationId)
    let message = ''
    if (!participation || participation.approvalStatus !== 'Pending') {
      message = 'Lượt tham gia không còn ở trạng thái Chờ duyệt. Vui lòng kiểm tra lại danh sách.'
    } else if (!['Approved', 'Rejected'].includes(approvalStatus)) {
      message = 'Trạng thái duyệt không hợp lệ.'
    } else if (approvalStatus === 'Rejected' && (!rejectedReason || rejectedReason.length > 500)) {
      message = 'Nhập lý do từ chối từ 1 đến 500 ký tự.'
    }
    return { participationId, success: !message, message: message || (approvalStatus === 'Approved' ? 'Đã duyệt.' : 'Đã từ chối.') }
  })
  const successfulIds = new Set(results.filter((item) => item.success).map((item) => item.participationId))
  const updatedAt = new Date().toISOString()
  return {
    results,
    participations: participations.map((item) => successfulIds.has(item.participationId)
      ? {
        ...item,
        approvalStatus,
        rejectedReason: approvalStatus === 'Rejected' ? rejectedReason : null,
        approvedAt: approvalStatus === 'Approved' ? updatedAt : null,
        approvedBy: approvalStatus === 'Approved' ? actor.actorUserId ?? null : null,
        approvedByLabel: approvalStatus === 'Approved' ? actor.actorLabel ?? null : null,
        updatedAt,
      }
      : item),
  }
}
