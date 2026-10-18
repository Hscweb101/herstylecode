const BASE = 'https://apiv2.shiprocket.in/v1/external'

export async function shiprocketToken(): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: Deno.env.get('SHIPROCKET_EMAIL'), password: Deno.env.get('SHIPROCKET_PASSWORD') }),
  })
  const data = await res.json()
  if (!res.ok || !data.token) throw new Error(`Shiprocket login failed: ${data.message ?? res.status}`)
  return data.token
}

export async function shiprocket(token: string, path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Shiprocket ${path}: ${data.message ?? JSON.stringify(data.errors ?? data)}`)
  return data
}
