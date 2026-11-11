import { useEffect, useState } from 'react'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import CertificateTemplateImage from './CertificateTemplateImage.jsx'

GlobalWorkerOptions.workerSrc = workerUrl

export default function CertificateTemplatePdf({ url, fileName, fieldPositions, onChange, onLoad }) {
  const [pdfDocument, setPdfDocument] = useState(null)
  const [pdfPageNumber, setPdfPageNumber] = useState(1)
  const [pdfPagePreview, setPdfPagePreview] = useState(null)
  const [pdfError, setPdfError] = useState('')

  useEffect(() => {
    const task = getDocument({ url, enableXfa: false, isEvalSupported: false })
    let active = true
    task.promise.then((pdf) => {
      if (active) setPdfDocument(pdf)
    }).catch(() => {
      if (active) setPdfError('Không mở được PDF. Hãy chọn PDF hợp lệ và không có mật khẩu.')
    })
    return () => {
      active = false
      void task.destroy().catch(() => {})
    }
  }, [url])

  useEffect(() => {
    if (!pdfDocument) return
    let active = true
    let renderTask
    let previewUrl
    async function renderPage() {
      const page = await pdfDocument.getPage(pdfPageNumber)
      if (!active) return
      const original = page.getViewport({ scale: 1 })
      const scale = Math.min(2, 1800 / Math.max(original.width, original.height))
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.ceil(viewport.width)
      canvas.height = Math.ceil(viewport.height)
      renderTask = page.render({ canvas, viewport })
      await renderTask.promise
      const blob = await new Promise((resolve) => canvas.toBlob(resolve))
      if (!active) return
      if (!blob) throw new Error('PDF preview unavailable')
      previewUrl = URL.createObjectURL(blob)
      setPdfPagePreview({ url: previewUrl, width: original.width * 4 / 3 })
    }
    renderPage().catch(() => {
      if (active) setPdfError('Không hiển thị được trang PDF này.')
    })
    return () => {
      active = false
      renderTask?.cancel()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [pdfDocument, pdfPageNumber])

  return (
    <>
      {pdfDocument && <div className="mb-3">
        <label className="form-label" htmlFor="template-pdf-page">Trang PDF</label>
        <select id="template-pdf-page" className="form-select w-auto" value={pdfPageNumber} onChange={(event) => {
          setPdfPagePreview(null)
          setPdfError('')
          setPdfPageNumber(Number(event.target.value))
        }}>
          {Array.from({ length: pdfDocument.numPages }, (_, index) => <option key={index + 1} value={index + 1}>Trang {index + 1}</option>)}
        </select>
      </div>}
      {pdfError ? <p className="alert alert-danger" role="alert">{pdfError}</p>
        : pdfPagePreview ? <CertificateTemplateImage key={pdfPageNumber} src={pdfPagePreview.url} fileName={`${fileName} · Trang ${pdfPageNumber}`}
          surfaceLabel="trang PDF" referenceWidth={pdfPagePreview.width} fieldPositions={fieldPositions[pdfPageNumber] ?? {}}
          onChange={onChange && ((positions) => onChange({ ...fieldPositions, [pdfPageNumber]: positions }))} onLoad={onLoad}
          onError={() => setPdfError('Không hiển thị được ảnh xem trước của trang PDF.')} />
          : <p role="status">Đang mở trang PDF…</p>}
    </>
  )
}
