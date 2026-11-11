import { useState } from 'react'

const fields = {
  fullName: 'Họ và tên',
  studentCode: 'MSSV',
  activityName: 'Tên hoạt động',
  activityDate: 'Ngày tổ chức',
  issuerName: 'Đơn vị cấp',
  issuedAt: 'Ngày phát hành',
  certificateCode: 'Mã chứng nhận',
  qrCode: 'Mã QR',
}

const sampleValues = {
  fullName: 'Nguyễn Minh Anh',
  studentCode: '02400001',
  activityName: 'Ngày hội việc làm sinh viên',
  activityDate: '16/11/2026',
  issuerName: 'Đơn vị tổ chức mẫu',
  issuedAt: '17/11/2026',
  certificateCode: 'CN-XEM-THU-001',
  qrCode: 'Vị trí mã QR',
}

export default function CertificateTemplateImage({ src, fileName, fieldPositions, onChange, onLoad, onError }) {
  const [selectedField, setSelectedField] = useState('fullName')
  const [showSampleContent, setShowSampleContent] = useState(false)
  const position = fieldPositions[selectedField]

  function setPosition(nextPosition) {
    onChange({ ...fieldPositions, [selectedField]: nextPosition })
  }

  function removePosition() {
    const nextPositions = { ...fieldPositions }
    delete nextPositions[selectedField]
    onChange(nextPositions)
  }

  return (
    <>
      {onChange && (
        <fieldset className="mb-3">
          <legend className="h6">Vị trí trường dữ liệu</legend>
          <div className="d-flex flex-wrap align-items-end gap-2 mb-2">
            <div>
              <label className="form-label" htmlFor="template-field">Trường dữ liệu</label>
              <select id="template-field" className="form-select" value={selectedField} onChange={(event) => setSelectedField(event.target.value)}>
                {Object.entries(fields).map(([key, label]) => (
                  <option key={key} value={key}>{label}{fieldPositions[key] ? ' · Đã đặt' : ''}</option>
                ))}
              </select>
            </div>
            {position ? (
              <button type="button" className="btn btn-outline-secondary" onClick={removePosition}>Bỏ vị trí</button>
            ) : (
              <button type="button" className="btn btn-outline-primary" onClick={() => setPosition({ x: 50, y: 50 })}>Đặt trường</button>
            )}
          </div>
          {position && (
            <div className="row g-2">
              {[['x', 'Ngang từ mép trái'], ['y', 'Dọc từ mép trên']].map(([axis, label]) => (
                <div className="col-12 col-sm-6" key={axis}>
                  <label className="form-label" htmlFor={`template-field-${axis}`}>{label} · {position[axis]}%</label>
                  <input id={`template-field-${axis}`} type="range" min="0" max="100" className="form-range"
                    value={position[axis]} onChange={(event) => setPosition({ ...position, [axis]: Number(event.target.value) })} />
                </div>
              ))}
            </div>
          )}
        </fieldset>
      )}
      <div className="form-check form-switch mb-2">
        <input id="template-sample-content" type="checkbox" role="switch" className="form-check-input"
          checked={showSampleContent} onChange={(event) => setShowSampleContent(event.target.checked)} />
        <label className="form-check-label" htmlFor="template-sample-content">Xem thử nội dung</label>
      </div>
      {showSampleContent && (
        <p className="small text-body-secondary mb-2">Dữ liệu minh họa tại các vị trí đã đặt. Cỡ chữ dùng để xem thử trên ảnh; ô QR đánh dấu vị trí.</p>
      )}
      <div className="bg-body-tertiary border rounded p-2 text-center">
        <div className="position-relative d-inline-block mw-100 overflow-hidden align-middle">
          <img src={src} alt={`Xem trước mẫu ${fileName}`} className="d-block img-fluid"
            style={{ maxHeight: '65vh' }} onLoad={onLoad} onError={onError} />
          {Object.entries(fieldPositions).map(([key, { x, y }]) => (
            <span key={key} className={showSampleContent ? 'position-absolute translate-middle template-sample-value' : `position-absolute translate-middle badge ${onChange && key === selectedField ? 'text-bg-primary' : 'text-bg-dark'}`}
              style={{ left: `${x}%`, top: `${y}%` }}>{showSampleContent ? sampleValues[key] : fields[key]}</span>
          ))}
        </div>
      </div>
    </>
  )
}
