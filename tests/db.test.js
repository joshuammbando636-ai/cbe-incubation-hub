// Loads supabase/schema.sql into an in-memory Postgres (PGlite) with a small
// stand-in for Supabase's auth schema, then checks triggers and RLS rules.
import { readFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import ExcelJS from 'exceljs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { EXPORT_SELECT, buildWorkbook } from '../src/lib/excel.js'

const AUTH_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text not null,
    raw_user_meta_data jsonb not null default '{}',
    email_confirmed_at timestamptz
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema public, auth to anon, authenticated;
`

const ids = {
  student: '00000000-0000-0000-0000-000000000001',
  other: '00000000-0000-0000-0000-000000000002',
  mentor: '00000000-0000-0000-0000-000000000003',
  admin: '00000000-0000-0000-0000-000000000004',
  prereg: '00000000-0000-0000-0000-000000000005',
}

let db

// Run SQL as a signed-in user, the way the browser would through Supabase.
async function as(userId, sql, params = []) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${userId}', false);`)
  try {
    return await db.query(sql, params)
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`)
  }
}

async function signUp(id, email, fullName, confirm = true) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
    id,
    email,
    { full_name: fullName },
  ])
  if (confirm) await db.query(`update auth.users set email_confirmed_at = now() where id = $1`, [id])
}

const hubId = async (short) =>
  (await db.query(`select id from hubs where short_name = $1`, [short])).rows[0].id

beforeAll(async () => {
  db = new PGlite()
  await db.exec(AUTH_STUB)
  await db.exec(readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8'))

  const logistics = await hubId('Smart Logistics Hub')
  const ai = await hubId('Artificial Intelligence Hub')

  // CBE already registered this student; their details should be claimed on confirm.
  await db.query(
    `insert into preregistered (email, full_name, reg_number, hub_id, idea_description, stage, support)
     values ('amina@example.com', 'Amina Juma', '03.12345.01.01.2026', $1, 'Cold storage for fish traders', 'prototype',
             array['Business Mentorship', 'Networking'])`,
    [logistics],
  )

  await signUp(ids.prereg, 'Amina@Example.com', 'amina j')
  await signUp(ids.student, 'baraka@example.com', 'Baraka Mushi')
  await signUp(ids.other, 'neema@example.com', 'Neema Said')
  await signUp(ids.mentor, 'mentor@example.com', 'Mentor One')
  await signUp(ids.admin, 'admin@example.com', 'Admin One')

  await db.query(`update profiles set hub_id = $1 where id = $2`, [logistics, ids.student])
  await db.query(`update profiles set hub_id = $1 where id = $2`, [ai, ids.other])
  await db.query(`update profiles set role = 'mentor' where id = $1`, [ids.mentor])
  await db.query(`update profiles set role = 'admin' where id = $1`, [ids.admin])
  await db.query(`insert into mentor_hubs values ($1, $2)`, [ids.mentor, logistics])
})

afterAll(async () => {
  await db?.close()
})

describe('sign-up', () => {
  it('creates a student profile with the name from the form', async () => {
    const { rows } = await db.query(`select role, full_name, email from profiles where id = $1`, [ids.student])
    expect(rows[0]).toEqual({ role: 'student', full_name: 'Baraka Mushi', email: 'baraka@example.com' })
  })

  it('claims the CBE record on email confirmation, even with different capitals', async () => {
    const p = (await db.query(`select full_name, reg_number from profiles where id = $1`, [ids.prereg])).rows[0]
    expect(p).toEqual({ full_name: 'Amina Juma', reg_number: '03.12345.01.01.2026' })

    const idea = (await db.query(`select description, stage from startup_ideas where owner_id = $1`, [ids.prereg])).rows[0]
    expect(idea).toEqual({ description: 'Cold storage for fish traders', stage: 'prototype' })

    const support = await db.query(
      `select t.name from student_support s join support_types t on t.id = s.support_type_id
       where s.student_id = $1 order by t.name`,
      [ids.prereg],
    )
    expect(support.rows.map((r) => r.name)).toEqual(['Business Mentorship', 'Networking'])

    const pre = (await db.query(`select claimed_by from preregistered where email = 'amina@example.com'`)).rows[0]
    expect(pre.claimed_by).toBe(ids.prereg)
  })

  it('does not claim anything before the email is confirmed', async () => {
    const lateId = '00000000-0000-0000-0000-000000000009'
    await db.query(`insert into preregistered (email, full_name) values ('late@example.com', 'Late Student')`)
    await signUp(lateId, 'late@example.com', 'Someone Else', false)
    const p = (await db.query(`select full_name from profiles where id = $1`, [lateId])).rows[0]
    expect(p.full_name).toBe('Someone Else')
    const pre = (await db.query(`select claimed_by from preregistered where email = 'late@example.com'`)).rows[0]
    expect(pre.claimed_by).toBe(null)
  })
})

describe('what the app reads after sign-in (profiles RLS)', () => {
  it('a student sees their own profile and staff names, not other students', async () => {
    const { rows } = await as(ids.student, `select id, role from profiles order by id`)
    const seen = rows.map((r) => r.id)
    expect(seen).toContain(ids.student)
    expect(seen).toContain(ids.mentor)
    expect(seen).not.toContain(ids.other)
    expect(seen).not.toContain(ids.prereg)
  })

  it('a mentor sees only students in their hubs', async () => {
    const { rows } = await as(ids.mentor, `select id from profiles where role = 'student'`)
    const seen = rows.map((r) => r.id).sort()
    expect(seen).toEqual([ids.student, ids.prereg].sort())
  })

  it('an admin sees every student', async () => {
    const { rows } = await as(ids.admin, `select count(*)::int as n from profiles where role = 'student'`)
    expect(rows[0].n).toBe(4)
  })

  it('anyone signed out sees no profiles', async () => {
    await db.exec(`set role anon`)
    try {
      await expect(db.query(`select * from profiles`)).rejects.toThrow(/permission denied/)
    } finally {
      await db.exec(`reset role`)
    }
  })
})

describe('student pages (what the browser is allowed to do)', () => {
  it('saves their own profile, but not the review flag', async () => {
    const r = await as(ids.student, `update profiles set phone = '0712345678', grad_year = 2027 where id = $1`, [
      ids.student,
    ])
    expect(r.affectedRows).toBe(1)
    await expect(as(ids.student, `update profiles set needs_review = true where id = $1`, [ids.student])).rejects.toThrow(
      /Only staff/,
    )
  })

  it("a programme's own department is saved, whatever department was sent", async () => {
    const { rows } = await db.query(
      `select d.id as dept, p.id as prog, p.department_id as real from departments d, programmes p
       where d.code = 'ICT' and p.department_id <> d.id limit 1`,
    )
    await as(ids.student, `update profiles set department_id = $1, programme_id = $2 where id = $3`, [
      rows[0].dept,
      rows[0].prog,
      ids.student,
    ])
    const saved = (await db.query(`select department_id from profiles where id = $1`, [ids.student])).rows[0]
    expect(saved.department_id).toBe(rows[0].real)
    await db.query(`update profiles set programme_id = null, department_id = null where id = $1`, [ids.student])
  })

  it('a registration number can only be used once', async () => {
    await expect(
      as(ids.student, `update profiles set reg_number = '03.12345.01.01.2026' where id = $1`, [ids.student]),
    ).rejects.toThrow(/reg_number/)
  })

  it('ticks support for themselves only', async () => {
    const t = (await db.query(`select id from support_types where name = 'Networking'`)).rows[0].id
    await as(ids.student, `insert into student_support values ($1, $2)`, [ids.student, t])
    await expect(as(ids.student, `insert into student_support values ($1, $2)`, [ids.other, t])).rejects.toThrow(
      /row-level security/,
    )
  })

  it('adds one idea, cannot pick a mentor, and cannot add a second', async () => {
    await expect(
      as(ids.student, `insert into startup_ideas (owner_id, description, mentor_id) values ($1, 'x', $2)`, [
        ids.student,
        ids.mentor,
      ]),
    ).rejects.toThrow(/row-level security/)
    await as(ids.student, `insert into startup_ideas (owner_id, description, stage) values ($1, 'Juice bar', 'idea')`, [
      ids.student,
    ])
    await expect(
      as(ids.student, `insert into startup_ideas (owner_id, description) values ($1, 'Second')`, [ids.student]),
    ).rejects.toThrow(/duplicate key/)
    const r = await as(ids.student, `update startup_ideas set business_name = 'Juicy' where owner_id = $1`, [ids.student])
    expect(r.affectedRows).toBe(1)
  })

  it('posts a pending video, but cannot mark it verified', async () => {
    const idea = (await db.query(`select id from startup_ideas where owner_id = $1`, [ids.student])).rows[0].id
    await expect(
      as(
        ids.student,
        `insert into progress_updates (idea_id, stage, video_url, status) values ($1, 'prototype', 'https://youtu.be/abcdefgh', 'verified')`,
        [idea],
      ),
    ).rejects.toThrow(/row-level security/)
    await as(
      ids.student,
      `insert into progress_updates (idea_id, stage, video_url) values ($1, 'prototype', 'https://youtu.be/abcdefgh')`,
      [idea],
    )
    const r = await as(ids.student, `update progress_updates set status = 'verified' where idea_id = $1`, [idea])
    expect(r.affectedRows).toBe(0)
  })

  it('a mentor verifying the video moves the stage', async () => {
    const idea = (await db.query(`select id from startup_ideas where owner_id = $1`, [ids.student])).rows[0].id
    await as(ids.mentor, `update progress_updates set status = 'verified' where idea_id = $1`, [idea])
    const { rows } = await db.query(`select stage from startup_ideas where id = $1`, [idea])
    expect(rows[0].stage).toBe('prototype')
  })

  it('sees published lessons only, and ticks them for themselves', async () => {
    await db.query(`insert into lessons (title, video_url, is_published) values ('Pitching', 'https://youtu.be/abcdefgh', true),
                    ('Draft', 'https://youtu.be/abcdefgh', false)`)
    const { rows } = await as(ids.student, `select id, title from lessons`)
    expect(rows.map((r) => r.title)).toEqual(['Pitching'])
    await as(ids.student, `insert into lesson_progress (lesson_id, student_id) values ($1, $2)`, [rows[0].id, ids.student])
    await expect(
      as(ids.student, `insert into lesson_progress (lesson_id, student_id) values ($1, $2)`, [rows[0].id, ids.other]),
    ).rejects.toThrow(/row-level security/)
  })
})

describe('staff pages (mentor limited to their hubs)', () => {
  let otherIdea
  beforeAll(async () => {
    otherIdea = (
      await db.query(`insert into startup_ideas (owner_id, description) values ($1, 'AI tutor') returning id`, [ids.other])
    ).rows[0].id
    await db.query(
      `insert into progress_updates (idea_id, stage, video_url) values ($1, 'prototype', 'https://youtu.be/abcdefgh')`,
      [otherIdea],
    )
  })

  it('a mentor reads only their own hub assignments', async () => {
    const { rows } = await as(ids.mentor, `select mentor_id from mentor_hubs`)
    expect(rows.every((r) => r.mentor_id === ids.mentor)).toBe(true)
  })

  it('a mentor cannot see or review videos from another hub', async () => {
    const seen = await as(ids.mentor, `select id from progress_updates where idea_id = $1`, [otherIdea])
    expect(seen.rows).toHaveLength(0)
    const r = await as(ids.mentor, `update progress_updates set status = 'verified' where idea_id = $1`, [otherIdea])
    expect(r.affectedRows).toBe(0)
  })

  it('a video can only be reviewed once (the app checks status = pending)', async () => {
    const idea = (await db.query(`select id from startup_ideas where owner_id = $1`, [ids.prereg])).rows[0].id
    await db.query(
      `insert into progress_updates (idea_id, stage, video_url) values ($1, 'operational', 'https://youtu.be/abcdefgh')`,
      [idea],
    )
    const sql = `update progress_updates set status = 'rejected', feedback = 'Too dark' where idea_id = $1 and status = 'pending'`
    expect((await as(ids.mentor, sql, [idea])).affectedRows).toBe(1)
    expect((await as(ids.admin, sql, [idea])).affectedRows).toBe(0)
    const { rows } = await db.query(`select reviewed_by, reviewed_at from progress_updates where idea_id = $1 and status = 'rejected'`, [idea])
    expect(rows[0].reviewed_by).toBe(ids.mentor)
    expect(rows[0].reviewed_at).not.toBe(null)
  })

  it('a mentor flags details to confirm and picks a mentor, in their hubs only', async () => {
    const flag = `update profiles set needs_review = true, review_note = 'Check reg number' where id = $1`
    expect((await as(ids.mentor, flag, [ids.student])).affectedRows).toBe(1)
    expect((await as(ids.mentor, flag, [ids.other])).affectedRows).toBe(0)
    const pick = `update startup_ideas set mentor_id = $1 where owner_id = $2`
    expect((await as(ids.mentor, pick, [ids.mentor, ids.student])).affectedRows).toBe(1)
    expect((await as(ids.mentor, pick, [ids.mentor, ids.other])).affectedRows).toBe(0)
  })

  it('an admin can move a student to another hub', async () => {
    const ai = await hubId('Artificial Intelligence Hub')
    const logistics = await hubId('Smart Logistics Hub')
    const move = `update profiles set hub_id = $1 where id = $2`
    expect((await as(ids.admin, move, [ai, ids.student])).affectedRows).toBe(1)
    await as(ids.admin, move, [logistics, ids.student])
  })

  it('the export view gives a mentor only their hubs', async () => {
    const { rows } = await as(ids.mentor, `select hub_short from students_export`)
    expect(new Set(rows.map((r) => r.hub_short))).toEqual(new Set(['Smart Logistics Hub']))
    const all = await as(ids.admin, `select count(*)::int as n from students_export`)
    expect(all.rows[0].n).toBe(4)
  })

  it('the Excel file: a mentor gets only their hub tab, an admin gets All Hubs plus every hub', async () => {
    const hubs = (await db.query(`select * from hubs`)).rows
    const logistics = hubs.filter((h) => h.short_name === 'Smart Logistics Hub')
    const sql = `select ${EXPORT_SELECT} from students_export order by full_name`

    const mine = (await as(ids.mentor, sql)).rows
    const mentorFile = buildWorkbook(ExcelJS, mine, logistics, false)
    expect(mentorFile.worksheets.map((w) => w.name)).toEqual(['Smart Logistics Hub'])
    const names = mentorFile.worksheets[0].getColumn(2).values.slice(2)
    expect(names).toEqual(['Amina Juma', 'Baraka Mushi'])
    expect(names).not.toContain('Neema Said')

    const everyone = (await as(ids.admin, sql)).rows
    const adminFile = buildWorkbook(ExcelJS, everyone, hubs, true)
    expect(adminFile.worksheets).toHaveLength(hubs.length + 1)
    expect(adminFile.worksheets[0].name).toBe('All Hubs')
    expect(adminFile.worksheets[0].rowCount).toBe(everyone.length + 1)
    // Readable by Excel: the file writes without errors.
    expect((await adminFile.xlsx.writeBuffer()).byteLength).toBeGreaterThan(0)
  })

  it('staff manage lessons; students cannot', async () => {
    await as(ids.mentor, `insert into lessons (title, video_url, created_by) values ('Costing', 'https://youtu.be/abcdefgh', $1)`, [
      ids.mentor,
    ])
    await expect(
      as(ids.student, `insert into lessons (title, video_url) values ('Mine', 'https://youtu.be/abcdefgh')`),
    ).rejects.toThrow(/row-level security/)
  })
})

describe('admin pages', () => {
  it('only an admin can change the dropdown lists', async () => {
    await expect(as(ids.mentor, `insert into campuses (name) values ('Zanzibar')`)).rejects.toThrow(/row-level security/)
    const renamed = await as(ids.mentor, `update hubs set name = 'Mine' where short_name = 'HR Tech Hub'`)
    expect(renamed.affectedRows).toBe(0)
    await as(ids.admin, `insert into campuses (name) values ('Zanzibar')`)
    await expect(as(ids.admin, `insert into campuses (name) values ('Zanzibar')`)).rejects.toThrow(/duplicate key/)
  })

  it('a choice in use cannot be deleted', async () => {
    await expect(
      as(ids.admin, `delete from hubs where short_name = 'Smart Logistics Hub'`),
    ).rejects.toThrow(/foreign key/)
    const unused = await as(ids.admin, `delete from campuses where name = 'Zanzibar'`)
    expect(unused.affectedRows).toBe(1)
  })

  it('hub short names fit an Excel tab', async () => {
    await expect(
      as(ids.admin, `insert into hubs (name, short_name) values ('Long Hub', repeat('x', 32))`),
    ).rejects.toThrow(/check constraint/)
  })

  it('only an admin changes roles and mentor hubs', async () => {
    await expect(as(ids.mentor, `update profiles set role = 'mentor' where id = $1`, [ids.student])).rejects.toThrow(
      /Only an admin can change roles/,
    )
    const ai = await hubId('Artificial Intelligence Hub')
    await expect(as(ids.mentor, `insert into mentor_hubs values ($1, $2)`, [ids.mentor, ai])).rejects.toThrow(
      /row-level security/,
    )
    await as(ids.admin, `insert into mentor_hubs values ($1, $2)`, [ids.mentor, ai])
    const { rows } = await as(ids.mentor, `select id from profiles where id = $1`, [ids.other])
    expect(rows).toHaveLength(1) // the mentor now sees the AI hub student
    await as(ids.admin, `delete from mentor_hubs where mentor_id = $1 and hub_id = $2`, [ids.mentor, ai])
  })

  it('admin search finds people by name or email', async () => {
    const { rows } = await as(
      ids.admin,
      `select email from profiles where full_name ilike '%baraka%' or email ilike '%baraka%'`,
    )
    expect(rows.map((r) => r.email)).toEqual(['baraka@example.com'])
  })
})

describe('guards', () => {
  it('a student cannot make themselves admin', async () => {
    await expect(as(ids.student, `update profiles set role = 'admin' where id = $1`, [ids.student])).rejects.toThrow(
      /Only an admin can change roles/,
    )
  })

  it('a student cannot edit another student', async () => {
    const r = await as(ids.student, `update profiles set phone = '0700' where id = $1`, [ids.other])
    expect(r.affectedRows).toBe(0)
  })

  it('a mentor cannot move a student to another hub', async () => {
    const ai = await hubId('Artificial Intelligence Hub')
    await expect(as(ids.mentor, `update profiles set hub_id = $1 where id = $2`, [ai, ids.student])).rejects.toThrow(
      /Only an admin can move a student/,
    )
  })

  it('a student cannot change their own idea stage', async () => {
    await expect(
      as(ids.prereg, `update startup_ideas set stage = 'revenue_generating' where owner_id = $1`, [ids.prereg]),
    ).rejects.toThrow(/Only a mentor can change the stage/)
  })
})

describe('meetings and notices', () => {
  let logistics, ai, dar, mwanza, programme
  const rls = /row-level security/
  const titles = async (who, table) =>
    (await as(who, `select title from ${table} order by title`)).rows.map((r) => r.title)
  const meet = (who, title, { hub = null, student = null, link = 'https://meet.google.com/abc-defg-hij' } = {}) =>
    as(who, `insert into meetings (title, starts_at, link, hub_id, student_id) values ($1, now(), $2, $3, $4)`, [
      title,
      link,
      hub,
      student,
    ])
  const post = (who, title, { campus = null, hub = null, prog = null } = {}) =>
    as(who, `insert into notices (title, body, campus_id, hub_id, programme_id) values ($1, 'Read this', $2, $3, $4)`, [
      title,
      campus,
      hub,
      prog,
    ])

  beforeAll(async () => {
    logistics = await hubId('Smart Logistics Hub')
    ai = await hubId('Artificial Intelligence Hub')
    const campus = async (name) => (await db.query(`select id from campuses where name = $1`, [name])).rows[0].id
    dar = await campus('Dar es Salaam')
    mwanza = await campus('Mwanza')
    programme = (await db.query(`select id from programmes order by name limit 1`)).rows[0].id
    // Baraka (student) and Amina (prereg): Logistics hub. Baraka studies `programme` in Dar. Neema (other): AI hub.
    await db.query(`update profiles set campus_id = $1, programme_id = $2 where id = $3`, [dar, programme, ids.student])
  })

  it('a mentor plans a meeting for their hub; only that hub sees it', async () => {
    await meet(ids.mentor, 'Hub call', { hub: logistics })
    expect(await titles(ids.student, 'meetings')).toContain('Hub call')
    expect(await titles(ids.prereg, 'meetings')).toContain('Hub call')
    expect(await titles(ids.other, 'meetings')).not.toContain('Hub call')
  })

  it('a one-student meeting is seen by that student only', async () => {
    await meet(ids.mentor, 'Just Baraka', { student: ids.student })
    expect(await titles(ids.student, 'meetings')).toContain('Just Baraka')
    expect(await titles(ids.prereg, 'meetings')).not.toContain('Just Baraka')
  })

  it("a mentor cannot plan for another hub, another hub's student, or everyone; a student cannot plan", async () => {
    await expect(meet(ids.mentor, 'AI', { hub: ai })).rejects.toThrow(rls)
    await expect(meet(ids.mentor, 'Neema', { student: ids.other })).rejects.toThrow(rls)
    await expect(meet(ids.mentor, 'All')).rejects.toThrow(rls)
    await expect(meet(ids.student, 'Mine', { hub: logistics })).rejects.toThrow(rls)
  })

  it('an admin plans for everyone; meeting links must be https', async () => {
    await meet(ids.admin, 'Town hall')
    for (const who of [ids.student, ids.other, ids.mentor]) expect(await titles(who, 'meetings')).toContain('Town hall')
    await expect(meet(ids.admin, 'Bad', { link: 'javascript:alert(1)' })).rejects.toThrow(/check constraint/)
  })

  it('notices reach only people who match campus, hub and programme', async () => {
    await post(ids.admin, 'For everyone')
    await post(ids.admin, 'Dar + programme', { campus: dar, prog: programme })
    await post(ids.admin, 'Mwanza only', { campus: mwanza })
    await post(ids.mentor, 'Logistics hub', { hub: logistics })
    expect(await titles(ids.student, 'notices')).toEqual(['Dar + programme', 'For everyone', 'Logistics hub'])
    expect(await titles(ids.prereg, 'notices')).toEqual(['For everyone', 'Logistics hub'])
    expect(await titles(ids.other, 'notices')).toEqual(['For everyone'])
  })

  it('a mentor posts only to their own hub, and cannot change an admin notice', async () => {
    await expect(post(ids.mentor, 'No hub')).rejects.toThrow(rls)
    await expect(post(ids.mentor, 'AI hub', { hub: ai })).rejects.toThrow(rls)
    await expect(post(ids.student, 'Me', { hub: logistics })).rejects.toThrow(rls)
    const theirs = await as(ids.mentor, `update notices set title = 'Changed' where title = 'For everyone'`)
    expect(theirs.affectedRows).toBe(0)
    const own = await as(ids.mentor, `update notices set body = 'Updated' where title = 'Logistics hub'`)
    expect(own.affectedRows).toBe(1)
  })

  it('the 002 migration runs on an existing database', async () => {
    await db.exec(readFileSync(new URL('../supabase/migrations/002_meetings_notices.sql', import.meta.url), 'utf8'))
    expect(await titles(ids.other, 'notices')).toEqual(['For everyone'])
  })
})

describe('notifications', () => {
  const mine = async (who) =>
    (await as(who, `select user_id, title from notifications order by created_at, title`)).rows

  it('setup already told the mentor about their role and hub', async () => {
    const titles = (await mine(ids.mentor)).map((n) => n.title)
    expect(titles.slice(0, 2)).toEqual(['You are now a mentor', 'New hub: Smart Logistics Hub'])
  })

  it('an admin making someone a mentor tells only that person', async () => {
    await as(ids.admin, `update profiles set role = 'mentor' where id = $1`, [ids.other])
    expect((await mine(ids.other)).map((n) => n.title)).toEqual(['You are now a mentor'])
    expect(await mine(ids.student)).toEqual([])
    // Even an admin reads only their own.
    expect((await mine(ids.admin)).every((n) => n.user_id === ids.admin)).toBe(true)
  })

  it('a person can dismiss their own, not create or dismiss others', async () => {
    const other = await as(ids.student, `delete from notifications where user_id = $1`, [ids.other])
    expect(other.affectedRows).toBe(0)
    await expect(
      as(ids.student, `insert into notifications (user_id, title, body) values ($1, 'Fake', 'x')`, [ids.student]),
    ).rejects.toThrow(/permission denied/)
    const own = await as(ids.other, `delete from notifications where user_id = $1`, [ids.other])
    expect(own.affectedRows).toBe(1)
    await as(ids.admin, `update profiles set role = 'student' where id = $1`, [ids.other])
  })

  it('the 003 migration runs on an existing database', async () => {
    await db.exec(readFileSync(new URL('../supabase/migrations/003_notifications.sql', import.meta.url), 'utf8'))
    expect((await mine(ids.other)).map((n) => n.title)).toEqual(['You are now a student'])
  })
})

describe('hub clusters and filled-in details', () => {
  const pick = async (id) =>
    (await db.query(`select department_id, cluster_id from profiles where id = $1`, [id])).rows[0]

  it('every hub has a cluster after setup', async () => {
    const { rows } = await db.query(`select name from hubs where cluster_id is null`)
    expect(rows).toEqual([])
  })

  it("choosing a programme fills its department; choosing a hub fills its cluster", async () => {
    const prog = (await db.query(`select id, department_id from programmes order by name limit 1`)).rows[0]
    const hub = (await db.query(`select id, cluster_id from hubs where name = 'Agribusiness Innovation Hub'`)).rows[0]
    await as(ids.other, `update profiles set programme_id = $1, hub_id = $2 where id = $3`, [prog.id, hub.id, ids.other])
    expect(await pick(ids.other)).toEqual({ department_id: prog.department_id, cluster_id: hub.cluster_id })
  })

  it('taking a hub from a mentor tells them; deleting an account does not fail', async () => {
    const ai = await hubId('Artificial Intelligence Hub')
    await as(ids.admin, `insert into mentor_hubs values ($1, $2)`, [ids.mentor, ai])
    const removed = await as(ids.admin, `delete from mentor_hubs where mentor_id = $1 and hub_id = $2`, [ids.mentor, ai])
    expect(removed.affectedRows).toBe(1)
    const titles = (await as(ids.mentor, `select title from notifications order by created_at`)).rows.map((r) => r.title)
    expect(titles).toContain('Removed from hub: Artificial Intelligence Hub')

    const temp = '00000000-0000-0000-0000-000000000099'
    await signUp(temp, 'temp@example.com', 'Temp Person')
    await db.query(`insert into mentor_hubs values ($1, $2)`, [temp, ai])
    await db.query(`delete from auth.users where id = $1`, [temp])
    expect((await db.query(`select count(*)::int as n from notifications where user_id = $1`, [temp])).rows[0].n).toBe(0)
  })

  it('the 004 migration runs on an existing database', async () => {
    await db.exec(readFileSync(new URL('../supabase/migrations/004_hub_clusters.sql', import.meta.url), 'utf8'))
    const { rows } = await db.query(`select count(*)::int as n from hubs where cluster_id is not null`)
    expect(rows[0].n).toBe(22)
  })
})
