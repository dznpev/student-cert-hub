function captureTemplateSnapshot(template, version = template?.version) {
  if (!template) return null
  const source = template.version === version
    ? template
    : template.previousVersions?.find((item) => item.version === version)
  if (!source) return null
  return {
    templateFile: source.templateFile ?? null,
    fieldPositions: structuredClone(source.fieldPositions ?? {}),
  }
}

export function queueCertificates(certificates, participations, participationIds, activities, templates) {
  const existingIds = new Set(certificates.map((item) => item.participationId))
  const requestedIds = new Set(participationIds)
  let nextId = Math.max(0, ...certificates.map((item) => item.certificateId))
  const addedCertificates = []
  for (const participation of participations) {
    if (!requestedIds.has(participation.participationId)
      || participation.approvalStatus !== 'Approved'
      || existingIds.has(participation.participationId)) continue

    const activity = activities.find((item) => item.activityId === participation.activityId)
    const template = activity && templates.find((item) => item.isActive && (
      activity.templateId == null ? item.isDefault : item.templateId === activity.templateId
    ))
    nextId += 1
    addedCertificates.push({
      certificateId: nextId,
      certificateCode: 'CN-DEMO-' + crypto.randomUUID(),
      participationId: participation.participationId,
      templateId: template?.templateId ?? null,
      templateName: template?.templateName ?? null,
      templateVersion: template?.version ?? null,
      templateSnapshot: captureTemplateSnapshot(template),
      createdAt: new Date().toISOString(),
      issuedAt: null,
      filePath: null,
      status: template ? 'Generating' : 'Failed',
      lastError: template ? null : 'Không tìm thấy hoạt động hoặc mẫu chứng nhận đang sử dụng phù hợp.',
    })
    existingIds.add(participation.participationId)
  }
  return [...addedCertificates, ...certificates]
}

export function processCertificate(certificates, certificateId, action, participations, activities, templates, reason = '', actor = {}) {
  const certificate = certificates.find((item) => item.certificateId === certificateId)
  const requiredStatus = action === 'revoke' ? 'Issued' : action === 'retry' ? 'Failed' : 'Generating'
  if (!certificate || !['success', 'failure', 'retry', 'revoke'].includes(action)
    || certificate.status !== requiredStatus) {
    return { success: false, message: 'Trạng thái chứng nhận không phù hợp với thao tác. Vui lòng kiểm tra lại.', certificates }
  }
  const participation = participations.find((item) => item.participationId === certificate.participationId)
  if (action !== 'revoke' && participation?.approvalStatus !== 'Approved') {
    return { success: false, message: 'Chỉ xử lý chứng nhận của lượt tham gia đã duyệt.', certificates }
  }
  const timestamp = new Date().toISOString()
  let changes
  let message
  if (action === 'revoke') {
    const revocationReason = reason.trim()
    if (!revocationReason || revocationReason.length > 500) {
      return { success: false, message: 'Nhập lý do thu hồi từ 1 đến 500 ký tự.', certificates }
    }
    changes = {
      status: 'Revoked',
      revokedAt: timestamp,
      revokedBy: actor.actorUserId ?? null,
      revokedByLabel: actor.actorLabel ?? null,
      revocationReason,
    }
    message = 'Đã thu hồi chứng nhận trong phiên mô phỏng. Lý do: ' + revocationReason
  } else if (action === 'retry') {
    changes = { status: 'Generating', lastError: null, issuedAt: null, filePath: null }
    message = 'Đã đưa chứng nhận vào hàng đợi mô phỏng để thử lại.'
  } else {
    const activity = activities.find((item) => item.activityId === participation.activityId)
    const template = certificate.templateId != null
      ? { templateId: certificate.templateId, templateName: certificate.templateName, version: certificate.templateVersion }
      : activity && templates.find((item) => item.isActive && (
        activity.templateId == null ? item.isDefault : item.templateId === activity.templateId
      ))
    const failed = action === 'failure' || !template || !activity
    const lastError = !template || !activity
      ? 'Không tìm thấy hoạt động hoặc mẫu chứng nhận phù hợp.'
      : 'Mô phỏng lỗi tạo hoặc ghi tệp PDF. Bạn có thể thử lại.'
    changes = {
      templateId: template?.templateId ?? null,
      templateName: template?.templateName ?? null,
      templateVersion: template?.version ?? null,
      templateSnapshot: certificate.templateSnapshot ?? captureTemplateSnapshot(
        templates.find((item) => item.templateId === template?.templateId), template?.version,
      ),
      status: failed ? 'Failed' : 'Issued',
      lastError: failed ? lastError : null,
      issuedAt: failed ? null : timestamp,
      filePath: null,
    }
    message = failed ? changes.lastError : 'Đã phát hành mô phỏng. Chưa có tệp PDF thật để tải.'
  }
  const processingHistory = [...(certificate.processingHistory ?? []), {
    action: action === 'revoke' ? 'Revoked' : action === 'retry' ? 'Retry' : 'Generate',
    timestamp,
    actorUserId: actor.actorUserId ?? null,
    actorLabel: actor.actorLabel ?? null,
    outcome: changes.status,
    message,
    previousError: action === 'retry' ? certificate.lastError ?? null : null,
  }]
  return {
    success: true,
    message,
    certificates: certificates.map((item) => item.certificateId === certificateId
      ? { ...item, ...changes, processingHistory } : item),
  }
}
