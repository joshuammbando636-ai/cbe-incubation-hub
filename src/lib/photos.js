import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// Profile photos live in the private "photos" bucket at <user id>/<time>.jpg
// (schema.sql: PROFILE PHOTOS). The browser shrinks them first, so each is small.

const BUCKET = 'photos'
const SIZE = 480 // pixels, square
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_UPLOAD = 10 * 1024 * 1024 // before shrinking

// Signed links last an hour; keep them so every avatar on a page shares one.
const links = new Map() // path -> { url, until }

async function linkFor(path) {
  const hit = links.get(path)
  if (hit && hit.until > Date.now()) return hit.url
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error) return null
  links.set(path, { url: data.signedUrl, until: Date.now() + 50 * 60 * 1000 })
  return data.signedUrl
}

// The photo's link, or null while loading / when there is none.
export function usePhotoUrl(path) {
  const [found, setFound] = useState({ path: null, url: null })
  useEffect(() => {
    if (!path) return
    let stale = false
    linkFor(path).then((url) => !stale && setFound({ path, url }))
    return () => {
      stale = true
    }
  }, [path])
  return path && found.path === path ? found.url : null
}

// Error text for a chosen file, or '' when it is fine.
export function checkPhoto(file) {
  if (!file) return ''
  if (!PHOTO_TYPES.includes(file.type)) return 'Choose a JPG, PNG or WebP photo.'
  if (file.size > MAX_UPLOAD) return 'That photo is too big. Choose one under 10 MB.'
  return ''
}

// Centre-crop to a square and shrink to SIZE px, as a JPEG.
async function shrink(file) {
  const image = await createImageBitmap(file)
  const side = Math.min(image.width, image.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  image.close?.()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that photo.'))), 'image/jpeg', 0.86),
  )
}

// Upload a new photo, point the profile at it, then remove the old file.
// Returns the new path.
export async function uploadPhoto(userId, file, oldPath) {
  const blob = await shrink(file)
  const path = `${userId}/${Date.now()}.jpg`
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' })
  if (up.error) throw up.error
  const { error } = await supabase.from('profiles').update({ photo_path: path }).eq('id', userId)
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
    throw error
  }
  if (oldPath) {
    links.delete(oldPath)
    await supabase.storage.from(BUCKET).remove([oldPath])
  }
  return path
}
