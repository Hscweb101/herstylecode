const SWATCHES: Record<string, string> = {
  gold: '#C9A24B',
  champagne: '#E8D3A8',
  black: '#1f1b1b',
  purple: '#6f3d8f',
  'wine purple': '#5b2a52',
  'mint green': '#9fd8bf',
  'aqua green': '#4fc1b0',
  'emerald green': '#1d7a55',
  'charcoal blue': '#34475a',
  'deep blue': '#1f3a73',
  green: '#3f9a6b',
  blue: '#2f5fa8',
  pink: '#e8a0b4',
  red: '#b3262f',
  white: '#f5f1e6',
  silver: '#c4c7cc',
  'rose gold': '#d9a58f',
  'antique gold': '#a8843a',
  copper: '#b87333',
  bronze: '#8c6a3a',
  oxidised: '#4a4a4a',
  oxidized: '#4a4a4a',
  peach: '#f3b79a',
  maroon: '#7a1f2b',
  wine: '#5b1a2e',
  brown: '#6b4a32',
  orange: '#e8833a',
  yellow: '#f0c93a',
  turquoise: '#3fb6b2',
  ivory: '#f6f0dc',
  cream: '#f3ead2',
  beige: '#d9c7a5',
  lavender: '#b9a5d6',
  magenta: '#b8337a',
  teal: '#1f7a7a',
  navy: '#1c2b52',
  grey: '#8d9096',
  gray: '#8d9096',
  coral: '#ef7b6a',
  mustard: '#c9a227',
  olive: '#6b6b2f',
}

const MULTI = 'conic-gradient(#d9534f, #f0ad4e, #5cb85c, #3fa7c4, #6f5bd0, #d9534f)'

/** A CSS background for a colour name, used for the little dot next to colour options. Falls back to any valid CSS colour. */
export function colourSwatch(name: string | null | undefined): string {
  const key = (name ?? '').trim().toLowerCase()
  if (!key) return '#d4cbb2'
  if (key.includes('multi')) return MULTI
  if (SWATCHES[key]) return SWATCHES[key]
  if (/^#[0-9a-f]{3,8}$/.test(key)) return key
  // "Light Pink", "Gold & Pearl": use the longest known colour word/phrase inside the name.
  const known = Object.keys(SWATCHES).sort((a, b) => b.length - a.length).find((k) => new RegExp(`\b${k}\b`).test(key))
  if (known) return SWATCHES[known]
  // Any other CSS colour name (turquoise, tomato, ...), tried on the whole name and then on each word.
  const supports = typeof CSS !== 'undefined' && typeof CSS.supports === 'function'
  if (supports) {
    for (const c of [key.replace(/\s+/g, ''), ...key.split(/[\s/&,-]+/)]) {
      if (c && CSS.supports('color', c)) return c
    }
  }
  return '#d4cbb2'
}
