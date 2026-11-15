import ExcelJS from 'exceljs'
import { describe, expect, it } from 'vitest'
import { COLUMNS, buildWorkbook, fileName, planTabs, tabName } from '../src/lib/excel.js'

const hubs = [
  { id: 'h1', name: 'Smart Logistics Hub', short_name: 'Logistics' },
  { id: 'h2', name: 'HR Tech Hub', short_name: 'HR Tech' },
]
const rows = [
  { full_name: 'Neema Said', hub: 'HR Tech Hub', hub_short: 'HR Tech', phone: '0712345678', grad_year: 2027, business_stage: 'Prototype Stage' },
  { full_name: 'Baraka Mushi', hub: 'Smart Logistics Hub', hub_short: 'Logistics', phone: null },
  { full_name: 'Amina Juma', hub: 'Smart Logistics Hub', hub_short: 'Logistics', support_requested: 'Funding; Networking' },
  { full_name: 'No Hub Yet', hub: null, hub_short: null },
]

describe('file name', () => {
  it('follows content.md', () => {
    const d = new Date(2026, 10, 5)
    expect(fileName(false, d)).toBe('CBE Incubation Hub - My Hubs - 2026-11-05.xlsx')
    expect(fileName(true, d)).toBe('CBE Incubation Hub - All Hubs - 2026-11-05.xlsx')
  })
})

describe('tab names', () => {
  it('keep Excel rules: 31 characters, no banned characters, unique', () => {
    const taken = new Set()
    expect(tabName('Logistics', taken)).toBe('Logistics')
    expect(tabName('logistics', taken)).toBe('logistics (2)')
    expect(tabName('A/B: [test]?', taken)).toBe('A B   test')
    const long = tabName('x'.repeat(40), taken)
    expect(long).toHaveLength(31)
    expect(tabName('x'.repeat(40), taken)).toBe('x'.repeat(27) + ' (2)')
  })
})

describe('tabs', () => {
  it('mentor: one tab per hub, only those students, by name', () => {
    const tabs = planTabs(rows, [hubs[0]], false)
    expect(tabs.map((t) => t.name)).toEqual(['Logistics'])
    expect(tabs[0].rows.map((r) => r.full_name)).toEqual(['Amina Juma', 'Baraka Mushi'])
  })

  it('admin: All Hubs with everyone first, then each hub', () => {
    const tabs = planTabs(rows, hubs, true)
    expect(tabs.map((t) => t.name)).toEqual(['All Hubs', 'HR Tech', 'Logistics'])
    expect(tabs[0].rows).toHaveLength(4)
  })
})

describe('workbook', () => {
  it('has the register columns, numbering per tab, plain black and white', async () => {
    const wb = buildWorkbook(ExcelJS, rows, hubs, true)
    // Write and read back, as Excel would open it.
    const back = new ExcelJS.Workbook()
    await back.xlsx.load(await wb.xlsx.writeBuffer())

    const all = back.getWorksheet('All Hubs')
    expect(all.getRow(1).values.slice(1)).toEqual(COLUMNS.map((c) => c.header))
    expect(all.getRow(1).font.bold).toBe(true)
    expect(all.rowCount).toBe(5)
    expect(all.getRow(2).values.slice(1, 3)).toEqual([1, 'Amina Juma'])
    expect(all.getCell('T5').value).toBe('')

    const hr = back.getWorksheet('HR Tech')
    const neema = hr.getRow(2)
    expect(neema.getCell(1).value).toBe(1)
    expect(neema.getCell(9).value).toBe(2027)
    expect(neema.getCell(10).value).toBe('0712345678') // leading zero kept

    // Thin borders on every cell, no fill colour anywhere.
    hr.eachRow((row) =>
      row.eachCell({ includeEmpty: true }, (cell) => {
        expect(cell.border.top.style).toBe('thin')
        expect(cell.border.right.style).toBe('thin')
        expect(cell.fill?.pattern ?? 'none').toBe('none')
      }),
    )
  })
})
