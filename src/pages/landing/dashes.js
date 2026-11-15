// Angles for the dash grid (DashRing.jsx): each dash starts steep and turns flat on scroll.
const COLS = 7
const ROWS = 5

export const DASHES = Array.from({ length: COLS * ROWS }, (_, i) => {
  const x = (i % COLS) / (COLS - 1)
  const y = Math.floor(i / COLS) / (ROWS - 1)
  const steep = 18 + 52 * x - 12 * y
  return { steep, flat: steep * 0.2 }
})
