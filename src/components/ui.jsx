import { useState } from 'react'
import { stageIndex, STAGES } from '../lib/labels.js'
import { MSG, errorMessage } from '../lib/text.js'
import { embedUrl, linkKind, youtubeId } from '../lib/youtube.js'

export function Spinner() {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">{MSG.loading}</span>
    </div>
  )
}

function describe(id, hint, error) {
  const hintId = hint ? `${id}-hint` : null
  const errorId = error ? `${id}-error` : null
  return { hintId, errorId, describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined }
}

function FieldText({ id, hint, error, hintId, errorId, children, label, labelFor = id }) {
  return (
    <div className="field">
      <label htmlFor={labelFor}>{label}</label>
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  )
}

// A labelled input with an optional hint and error, wired up for screen readers.
export function Field({ id, label, hint, error, multiline, ...inputProps }) {
  const d = describe(id, hint, error)
  const Tag = multiline ? 'textarea' : 'input'
  const isPassword = inputProps.type === 'password'
  const [shown, setShown] = useState(false)
  const input = (
    <Tag
      id={id}
      name={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={d.describedBy}
      rows={multiline ? 4 : undefined}
      {...inputProps}
      type={isPassword && shown ? 'text' : inputProps.type}
    />
  )
  return (
    <FieldText id={id} label={label} hint={hint} error={error} {...d}>
      {isPassword ? (
        <div className="password-wrap">
          {input}
          <button
            type="button"
            className="link-button password-toggle"
            aria-controls={id}
            aria-pressed={shown}
            aria-label={`Show ${label.toLowerCase()}`}
            onClick={() => setShown((s) => !s)}
          >
            {shown ? 'Hide' : 'Show'}
          </button>
        </div>
      ) : (
        input
      )}
    </FieldText>
  )
}

// A dropdown that always starts with "Choose…". options: [{ value, label }]
export function SelectField({ id, label, hint, error, options, value, onChange, placeholder = 'Choose…', ...props }) {
  const d = describe(id, hint, error)
  return (
    <FieldText id={id} label={label} hint={hint} error={error} {...d}>
      <select
        id={id}
        name={id}
        value={value ?? ''}
        onChange={onChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={d.describedBy}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldText>
  )
}

// Words typed in a search box: every word must appear somewhere in the text.
function matchesWords(text, query) {
  const hay = text.toLowerCase()
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((w) => hay.includes(w))
}

// A dropdown you can type into, for long lists (programmes, hubs, sectors).
// options: [{ value, label, meta? }]. onChange gets { target: { value } }, like a <select>.
export function SearchSelect({ id, label, hint, error, options, value, onChange, placeholder = 'Type to search…', disabled }) {
  const d = describe(id, hint, error)
  const chosen = options.find((o) => o.value === value)
  const [query, setQuery] = useState(null) // null = not typing; show the chosen label
  const [active, setActive] = useState(0)
  const open = query !== null
  const matches = open ? options.filter((o) => matchesWords(`${o.label} ${o.meta ?? ''}`, query)) : []
  const listId = `${id}-list`

  function pick(o) {
    onChange({ target: { value: o ? o.value : '' } })
    setQuery(null)
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setQuery('')
      setActive((i) => Math.min(i + 1, Math.max(matches.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && open) {
      e.preventDefault()
      if (matches[active]) pick(matches[active])
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      setQuery(null)
    }
  }

  return (
    <FieldText id={id} label={label} hint={hint} error={error} {...d}>
      <div className="search-select">
        <input
          id={id}
          name={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${id}-opt-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={d.describedBy}
          placeholder={chosen ? undefined : placeholder}
          disabled={disabled}
          value={open ? query : (chosen?.label ?? '')}
          onFocus={(e) => {
            setQuery('')
            setActive(0)
            e.target.select()
          }}
          onBlur={() => setQuery(null)}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
        />
        {chosen && !disabled && !open && (
          <button type="button" className="link-button search-clear" aria-label={`Clear ${label.toLowerCase()}`} onClick={() => pick(null)}>
            ×
          </button>
        )}
        {open && (
          <ul id={listId} role="listbox" className="search-list" aria-label={label}>
            {matches.length === 0 ? (
              <li className="search-none">No match. Try fewer letters.</li>
            ) : (
              matches.map((o, i) => (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={o.value === value}
                  className={i === active ? 'is-active' : undefined}
                  // mousedown, not click: it fires before the input loses focus
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(o)
                  }}
                >
                  <span>{o.label}</span>
                  {o.meta && <span className="search-meta">{o.meta}</span>}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </FieldText>
  )
}

// Radio buttons in a fieldset. options: [{ value, label, meaning? }]
export function RadioGroup({ name, legend, hint, error, options, value, onChange }) {
  const d = describe(name, hint, error)
  return (
    <fieldset className="field choice-group" aria-describedby={d.describedBy} id={name} tabIndex={-1}>
      <legend>{legend}</legend>
      {hint && (
        <p className="hint" id={d.hintId}>
          {hint}
        </p>
      )}
      {options.map((o) => (
        <label key={o.value} className="choice">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            aria-invalid={error ? true : undefined}
          />
          <span>
            <span className="choice-label">{o.label}</span>
            {o.meaning && <span className="choice-meaning">{o.meaning}</span>}
          </span>
        </label>
      ))}
      {error && (
        <p className="field-error" id={d.errorId}>
          {error}
        </p>
      )}
    </fieldset>
  )
}

export function Checkbox({ label, checked, onChange, disabled }) {
  return (
    <label className="choice">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span className="choice-label">{label}</span>
    </label>
  )
}

// kind: 'ok' (done), 'wait' (amber), 'error' (red)
export function Notice({ kind = 'ok', title, children }) {
  return (
    <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {title && <p className="notice-title">{title}</p>}
      {children}
    </div>
  )
}

// While busy the button is disabled. Pass busyLabel (e.g. MSG.saving) to swap
// the text; otherwise the text stays and only the button dims.
export function Button({ busy, busyLabel, children, variant = 'primary', ...props }) {
  return (
    <button className={`btn btn-${variant}`} disabled={busy} aria-busy={busy || undefined} {...props}>
      {busy && busyLabel ? busyLabel : children}
    </button>
  )
}

// For a page whose data failed to load.
export function LoadError({ error, onRetry }) {
  return (
    <Notice kind="error">
      <p>{errorMessage(error)}</p>
      <Button type="button" variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </Notice>
  )
}

// A saved video link, following content.md: YouTube → "Watch video",
// other web address → warn it opens elsewhere, anything else → cannot be opened.
export function VideoLink({ url, label = 'Watch video' }) {
  const kind = linkKind(url)
  if (kind === 'bad') return <span className="small">{MSG.badSavedLink}</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="link-btn link-btn--small link-btn--out">
      {kind === 'youtube' ? label : 'Watch video (opens in a new tab)'}
    </a>
  )
}

// Loads the YouTube player only when asked, to save students' data.
export function VideoPlayer({ url, title }) {
  const [open, setOpen] = useState(false)
  const id = youtubeId(url)
  if (!id) return null
  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Watch
      </Button>
    )
  }
  return (
    <div className="player">
      <iframe
        src={embedUrl(id)}
        title={title}
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  )
}

// Idea Stage → Prototype Stage → Operational → Revenue Generating
export function StageTracker({ stage }) {
  const current = stageIndex(stage)
  return (
    <ol className="tracker">
      {STAGES.map((s, i) => (
        <li
          key={s.value}
          className={i < current ? 'is-done' : i === current ? 'is-current' : undefined}
          aria-current={i === current ? 'step' : undefined}
        >
          {s.label}
        </li>
      ))}
    </ol>
  )
}
