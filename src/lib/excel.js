// Builds the Excel register (content.md, "Excel file").
// Plain black and white: bold header row, thin borders, no colours.
// Rows come from the students_export view; RLS has already limited them, so a
// mentor's rows only ever hold their own hubs.

// Columns in CBE's register order. `key` is the students_export column.
export const COLUMNS = [
  { header: 'No.', key: null, width: 6 },
  { header: 'Full Name', key: 'full_name', width: 28 },
  { header: 'Registration Number', key: 'reg_number', width: 22 },
  { header: 'Gender', key: 'gender', width: 9 },
  { header: 'Campus', key: 'campus', width: 16 },
  { header: 'Department', key: 'department', width: 28 },
  { header: 'Programme', key: 'programme', width: 32 },
  { header: 'Level of Study', key: 'level_of_study', width: 16 },
  { header: 'Expected Graduation Year', key: 'grad_year', width: 12 },
  { header: 'Phone Number', key: 'phone', width: 14 },
  { header: 'Email', key: 'email', width: 30 },
  { header: 'Cluster', key: 'cluster', width: 24 },
  { header: 'Innovation Hub', key: 'hub', width: 28 },
  { header: 'Business Idea / Project', key: 'business_idea', width: 45 },
  { header: 'Business Sector', key: 'business_sector', width: 22 },
  { header: 'Business Name', key: 'business_name', width: 22 },
  { header: 'Owns a Business', key: 'owns_business', width: 10 },
  { header: 'Business Stage', key: 'business_stage', width: 18 },
  { header: 'Support Requested', key: 'support_requested', width: 40 },
  { header: 'Mentor', key: 'mentor', width: 24 },
]

export const EXPORT_SELECT = [...new Set(['hub_short', ...COLUMNS.map((c) => c.key).filter(Boolean)])].join(', ')

export const ALL_HUBS_TAB = 'All Hubs'

const pad = (n) => String(n).padStart(2, '0')
export const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function fileName(isAdmin, date = new Date()) {
  return `CBE Incubation Hub - ${isAdmin ? 'All Hubs' : 'My Hubs'} - ${isoDate(date)}.xlsx`
}

// Excel tab names: 31 characters, none of : \ / ? * [ ], not starting or
// ending with an apostrophe, and unique (ignoring case).
export function tabName(name, taken) {
  let base = (name || 'Hub').replace(/[:\\/?*[\]]/g, ' ').replace(/^'+|'+$/g, '').trim().slice(0, 31) || 'Hub'
  let candidate = base
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) {
    const suffix = ` (${n})`
    candidate = base.slice(0, 31 - suffix.length) + suffix
  }
  taken.add(candidate.toLowerCase())
  return candidate
}

const byName = (a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '')

// The tabs to write, in order: [{ name, rows }].
// Admin: "All Hubs" with everyone, then one tab per hub.
// Mentor: one tab per hub they look after.
export function planTabs(rows, hubs, isAdmin) {
  const taken = new Set()
  const tabs = []
  if (isAdmin) tabs.push({ name: tabName(ALL_HUBS_TAB, taken), rows: [...rows].sort(byName) })
  for (const h of [...hubs].sort((a, b) => a.short_name.localeCompare(b.short_name))) {
    tabs.push({
      name: tabName(h.short_name, taken),
      rows: rows.filter((r) => r.hub_short === h.short_name).sort(byName),
    })
  }
  return tabs
}

const THIN = { style: 'thin', color: { argb: 'FF000000' } }
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN }

// Fills an ExcelJS workbook. ExcelJS is passed in so the browser can load it
// only when someone presses Download.
export function buildWorkbook(ExcelJS, rows, hubs, isAdmin) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'CBE Incubation Hub'
  wb.created = new Date()

  for (const tab of planTabs(rows, hubs, isAdmin)) {
    const ws = wb.addWorksheet(tab.name, { views: [{ state: 'frozen', ySplit: 1 }] })
    ws.columns = COLUMNS.map((c) => ({ header: c.header, width: c.width }))
    tab.rows.forEach((r, i) => {
      ws.addRow(COLUMNS.map((c) => (c.key ? (r[c.key] ?? '') : i + 1)))
    })
    ws.getRow(1).font = { bold: true }
    ws.eachRow((row) => {
      for (let col = 1; col <= COLUMNS.length; col++) {
        const cell = row.getCell(col)
        cell.border = BORDER
        cell.alignment = { vertical: 'top', wrapText: row.number === 1 }
      }
    })
  }
  return wb
}
