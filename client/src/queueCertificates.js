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
