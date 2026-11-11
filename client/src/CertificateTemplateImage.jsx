import { useEffect, useRef, useState } from 'react'
import TemplatePreviewQr from './TemplatePreviewQr.jsx'

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

const fontFamilies = ['Arial', 'Times New Roman', 'Calibri', 'Cambria', 'Verdana', 'Courier New']
const alignments = { left: 'Căn trái', center: 'Căn giữa', right: 'Căn phải' }
const horizontalOffsets = { left: '0', center: '-50%', right: '-100%' }
const imageAnchors = { left: 0, center: 50, right: 100 }
const verticalAlignments = { top: 'Căn trên', middle: 'Căn giữa dọc', bottom: 'Căn dưới' }
const verticalAnchors = { top: 0, middle: 50, bottom: 100 }
const verticalOffsets = { top: '0', middle: '-50%', bottom: '-100%' }

export default function CertificateTemplateImage({ src, fileName, fieldPositions, onChange, onLoad, onError }) {
  const [selectedField, setSelectedField] = useState('fullName')
  const [showSampleContent, setShowSampleContent] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(0)
  const [naturalWidth, setNaturalWidth] = useState(0)
  const [editHistory, setEditHistory] = useState({ past: [], future: [] })
  const imageRef = useRef(null)
  const dragRef = useRef(null)
  const position = fieldPositions[selectedField]
  const fontSizePt = position?.fontSizePt ?? Number(((position?.fontSize ?? 2) * naturalWidth / 100 * 0.75).toFixed(1))

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setPreviewWidth(entry.contentRect.width))
    observer.observe(imageRef.current)
    return () => observer.disconnect()
  }, [])

  function changePositions(nextPositions) {
    setEditHistory((current) => ({ past: [...current.past, fieldPositions], future: [] }))
    onChange(nextPositions)
  }

  function setPosition(nextPosition) {
    changePositions({ ...fieldPositions, [selectedField]: nextPosition })
  }

  function removePosition() {
    const nextPositions = { ...fieldPositions }
    delete nextPositions[selectedField]
    changePositions(nextPositions)
  }

  function undoEdit() {
    if (!editHistory.past.length) return
    onChange(editHistory.past.at(-1))
    setEditHistory({
      past: editHistory.past.slice(0, -1),
      future: [fieldPositions, ...editHistory.future],
    })
  }

  function redoEdit() {
    if (!editHistory.future.length) return
    onChange(editHistory.future[0])
    setEditHistory({
      past: [...editHistory.past, fieldPositions],
      future: editHistory.future.slice(1),
    })
  }

  function startDrag(event, key) {
    if (!onChange || event.button !== 0) return
    event.preventDefault()
    setSelectedField(key)
    event.currentTarget.focus()
    event.currentTarget.setPointerCapture(event.pointerId)
    const bounds = imageRef.current.getBoundingClientRect()
    dragRef.current = {
      key,
      pointerId: event.pointerId,
      before: fieldPositions,
      offsetX: event.clientX - bounds.left - fieldPositions[key].x / 100 * bounds.width,
      offsetY: event.clientY - bounds.top - fieldPositions[key].y / 100 * bounds.height,
    }
  }

  function moveField(event) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const bounds = imageRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, (event.clientX - bounds.left - drag.offsetX) / bounds.width * 100))
    const y = Math.max(0, Math.min(100, (event.clientY - bounds.top - drag.offsetY) / bounds.height * 100))
    onChange({ ...fieldPositions, [drag.key]: { ...fieldPositions[drag.key], x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) } })
  }

  function finishDrag(event) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    const before = drag.before[drag.key]
    const after = fieldPositions[drag.key]
    if (before.x !== after.x || before.y !== after.y) {
      setEditHistory((current) => ({ past: [...current.past, drag.before], future: [] }))
    }
  }

  function moveWithKeyboard(event, key) {
    const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
    const direction = directions[event.key]
    if (!onChange || !direction) return
    event.preventDefault()
    const step = event.shiftKey ? 5 : 0.5
    const current = fieldPositions[key]
    changePositions({ ...fieldPositions, [key]: {
      ...current,
      x: Math.max(0, Math.min(100, current.x + direction[0] * step)),
      y: Math.max(0, Math.min(100, current.y + direction[1] * step)),
    } })
  }

  return (
    <>
      {onChange && (
        <fieldset className="mb-3">
          <legend className="h6">Vị trí trường dữ liệu</legend>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!editHistory.past.length} onClick={undoEdit}>
              Hoàn tác
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!editHistory.future.length} onClick={redoEdit}>
              Làm lại
            </button>
          </div>
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
              {selectedField === 'qrCode' ? (
                <div className="col-12">
                  <label className="form-label" htmlFor="template-qr-size">Kích thước QR · {position.qrSize ?? 18}% chiều rộng ảnh</label>
                  <input id="template-qr-size" type="range" min="5" max="40" step="1" className="form-range"
                    value={position.qrSize ?? 18} onChange={(event) => setPosition({ ...position, qrSize: Number(event.target.value) })} />
                </div>
              ) : (
                <div className="col-12">
                  <div className="d-flex flex-wrap align-items-end gap-2">
                    <div>
                      <label className="form-label" htmlFor="template-field-font">Phông chữ</label>
                      <select id="template-field-font" className="form-select" value={position.fontFamily ?? 'Arial'}
                        onChange={(event) => setPosition({ ...position, fontFamily: event.target.value })}>
                        {fontFamilies.map((font) => <option key={font} style={{ fontFamily: font }}>{font}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label" htmlFor="template-field-font-size">Cỡ chữ (pt)</label>
                      <input id="template-field-font-size" type="number" min="1" max="200" step="0.5"
                        className="form-control" style={{ width: '7rem' }} value={fontSizePt}
                        onChange={(event) => {
                          const value = event.target.valueAsNumber
                          if (Number.isFinite(value) && value >= 1 && value <= 200) setPosition({ ...position, fontSizePt: value })
                        }} />
                    </div>
                    <div>
                      <label className="form-label" htmlFor="template-field-color">Màu chữ</label>
                      <input id="template-field-color" type="color" className="form-control form-control-color"
                        value={position.color ?? '#172235'}
                        onChange={(event) => setPosition({ ...position, color: event.target.value })} />
                    </div>
                    <div className="btn-group" role="group" aria-label="Kiểu chữ">
                      <button type="button" className={'btn fw-bold ' + (position.bold ? 'btn-primary' : 'btn-outline-primary')}
                        aria-label="In đậm" aria-pressed={Boolean(position.bold)} onClick={() => setPosition({ ...position, bold: !position.bold })}>B</button>
                      <button type="button" className={'btn fst-italic ' + (position.italic ? 'btn-primary' : 'btn-outline-primary')}
                        aria-label="In nghiêng" aria-pressed={Boolean(position.italic)} onClick={() => setPosition({ ...position, italic: !position.italic })}>I</button>
                      <button type="button" className={'btn text-decoration-underline ' + (position.underline ? 'btn-primary' : 'btn-outline-primary')}
                        aria-label="Gạch chân" aria-pressed={Boolean(position.underline)} onClick={() => setPosition({ ...position, underline: !position.underline })}>U</button>
                    </div>
                    <div>
                      <div id="template-alignment-label" className="form-label">Căn theo ảnh</div>
                      <div className="btn-group" role="group" aria-labelledby="template-alignment-label">
                        {Object.entries(alignments).map(([value, label]) => {
                          const aligned = (position.textAlign ?? 'center') === value && position.x === imageAnchors[value]
                          return (
                            <button key={value} type="button" className={'btn ' + (aligned ? 'btn-primary' : 'btn-outline-primary')}
                              aria-pressed={aligned} onClick={() => setPosition({ ...position, textAlign: value, x: imageAnchors[value] })}>
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <div id="template-vertical-alignment-label" className="form-label">Căn dọc theo ảnh</div>
                      <div className="btn-group" role="group" aria-labelledby="template-vertical-alignment-label">
                        {Object.entries(verticalAlignments).map(([value, label]) => {
                          const aligned = (position.verticalAlign ?? 'middle') === value && position.y === verticalAnchors[value]
                          return (
                            <button key={value} type="button" className={'btn ' + (aligned ? 'btn-primary' : 'btn-outline-primary')}
                              aria-pressed={aligned} onClick={() => setPosition({ ...position, verticalAlign: value, y: verticalAnchors[value] })}>
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="form-text mb-0">Bật Xem thử nội dung để xem kiểu chữ. Cỡ pt được quy đổi theo ảnh gốc; phông chữ dùng trên máy của bạn.</p>
                </div>
              )}
            </div>
          )}
        </fieldset>
      )}
      {onChange && <p className="small text-body-secondary mb-2">Kéo chữ đến vị trí mong muốn. Có thể chọn chữ rồi dùng phím mũi tên để chỉnh, giữ Shift để di chuyển nhanh.</p>}
      <div className="form-check form-switch mb-2">
        <input id="template-sample-content" type="checkbox" role="switch" className="form-check-input"
          checked={showSampleContent} onChange={(event) => setShowSampleContent(event.target.checked)} />
        <label className="form-check-label" htmlFor="template-sample-content">Xem thử nội dung</label>
      </div>
      {showSampleContent && (
        <p className="small text-body-secondary mb-2">
          Dữ liệu minh họa tại các vị trí đã đặt. QR mở chứng nhận mẫu CN-MAU-001; địa chỉ localhost chỉ mở trên máy chạy dự án.
        </p>
      )}
      <div className="bg-body-tertiary border rounded p-2 text-center">
        <div className="position-relative d-inline-block mw-100 overflow-hidden align-middle">
          <img ref={imageRef} src={src} alt={`Xem trước mẫu ${fileName}`} className="d-block img-fluid"
            draggable={false} style={{ maxHeight: '65vh' }} onLoad={(event) => { setNaturalWidth(event.currentTarget.naturalWidth); onLoad?.(event) }} onError={onError} />
          {Object.entries(fieldPositions).map(([key, { x, y, fontSize = 2, fontSizePt: savedFontSizePt, fontFamily = 'Arial', bold, italic, underline, color = '#172235', textAlign = 'center', verticalAlign = 'middle', qrSize = 18 }]) => (
            <span key={key} className={`template-field-overlay ${showSampleContent ? 'template-sample-value' : `badge ${onChange && key === selectedField ? 'text-bg-primary' : 'text-bg-dark'}`}`}
              role={onChange ? 'button' : undefined} tabIndex={onChange ? 0 : undefined}
              aria-label={onChange ? `Di chuyển ${fields[key]}` : undefined}
              data-editable={Boolean(onChange)} data-selected={onChange && key === selectedField}
              onFocus={() => setSelectedField(key)}
              onPointerDown={(event) => startDrag(event, key)} onPointerMove={moveField}
              onPointerUp={finishDrag} onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}
              onKeyDown={(event) => moveWithKeyboard(event, key)}
              style={{ left: `${x}%`, top: `${y}%`,
                width: showSampleContent && key === 'qrCode' ? `${previewWidth * qrSize / 100}px` : undefined,
                transform: `translate(${horizontalOffsets[key === 'qrCode' ? 'center' : textAlign] ?? '-50%'}, ${verticalOffsets[key === 'qrCode' ? 'middle' : verticalAlign] ?? '-50%'})`,
                fontFamily: showSampleContent ? fontFamily : undefined,
                fontWeight: showSampleContent ? (bold ? 700 : 400) : undefined,
                fontStyle: showSampleContent && italic ? 'italic' : undefined,
                color: showSampleContent ? color : undefined,
                textDecoration: showSampleContent && underline ? 'underline' : undefined,
                fontSize: showSampleContent && key !== 'qrCode'
                  ? `${savedFontSizePt != null && naturalWidth ? savedFontSizePt * 4 / 3 * previewWidth / naturalWidth : previewWidth * fontSize / 100}px`
                  : undefined }}>
              {showSampleContent && key === 'qrCode' ? <TemplatePreviewQr /> : showSampleContent ? sampleValues[key] : fields[key]}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
