import { useState } from 'react'
import { EXPORT_SELECT, buildWorkbook, fileName } from '../lib/excel.js'
import { loadExportRows } from '../lib/staffData.js'
import { Button, Notice } from './ui.jsx'

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

// "Download Excel" on the Students screen. hubs: the hubs this person looks after.
export function DownloadExcel({ isAdmin, hubs }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function download() {
    setBusy(true)
    setFailed(false)
    try {
      // ExcelJS is large, so it loads only when needed.
      const [{ default: ExcelJS }, rows] = await Promise.all([import('exceljs'), loadExportRows(EXPORT_SELECT)])
      const buffer = await buildWorkbook(ExcelJS, rows, hubs, isAdmin).xlsx.writeBuffer()
      const url = URL.createObjectURL(new Blob([buffer], { type: XLSX }))
      const a = document.createElement('a')
      a.href = url
      a.download = fileName(isAdmin)
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch (error) {
      console.error(error)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="download">
      <Button type="button" variant="secondary" busy={busy} busyLabel="Preparing file…" onClick={download}>
        Download Excel
      </Button>
      {failed && (
        <Notice kind="error">
          <p>Could not make the file. Try again.</p>
        </Notice>
      )}
    </div>
  )
}
