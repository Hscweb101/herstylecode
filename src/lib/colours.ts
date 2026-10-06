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
}

const MULTI = 'conic-gradient(#d9534f, #f0ad4e, #5cb85c, #3fa7c4, #6f5bd0, #d9534f)'

/** A CSS background for a colour name, used for the little dot next to colour options. */
export function colourSwatch(name: string | null | undefined): string {
  const key = (name ?? '').trim().toLowerCase()
  if (!key) return '#d4cbb2'
  if (key.includes('multi')) return MULTI
  return SWATCHES[key] ?? '#d4cbb2'
}
