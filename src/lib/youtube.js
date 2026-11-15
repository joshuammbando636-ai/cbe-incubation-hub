const HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be'])
const ID = /^[A-Za-z0-9_-]{6,20}$/

function parse(value) {
  try {
    const url = new URL(String(value).trim())
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

// The video id from any common YouTube link, or '' if it is not one.
export function youtubeId(value) {
  const url = parse(value)
  if (!url || !HOSTS.has(url.hostname.toLowerCase())) return ''
  let id = ''
  if (url.hostname.toLowerCase().endsWith('youtu.be')) {
    id = url.pathname.split('/')[1] || ''
  } else if (url.pathname === '/watch') {
    id = url.searchParams.get('v') || ''
  } else {
    const [, kind, rest] = url.pathname.split('/')
    if (['shorts', 'live', 'embed', 'v'].includes(kind)) id = rest || ''
  }
  return ID.test(id) ? id : ''
}

export const isYoutubeLink = (value) => youtubeId(value) !== ''

// For links already saved: 'youtube' | 'web' | 'bad'
export function linkKind(value) {
  if (isYoutubeLink(value)) return 'youtube'
  return parse(value) ? 'web' : 'bad'
}

// Privacy-friendly player address. Only loaded when someone presses Watch.
export const embedUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}?rel=0`
