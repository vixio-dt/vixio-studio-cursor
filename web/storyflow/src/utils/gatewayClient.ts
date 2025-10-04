import type { Story } from '../types/story'

const BASE_URL = import.meta.env.VITE_GATEWAY_HTTP_URL || 'http://localhost:8080'

const buildHeaders = (token?: string) => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  const tk = token || import.meta.env.VITE_AUTH_TOKEN || ''
  if (tk) h['Authorization'] = `Bearer ${tk}`
  return h
}

export async function fetchStory(token?: string) {
  const res = await fetch(`${BASE_URL}/story`, { headers: buildHeaders(token) })
  if (!res.ok) throw new Error(`Failed to fetch story: ${res.status}`)
  return res.json()
}

export async function saveStory(story: Story, token?: string) {
  const res = await fetch(`${BASE_URL}/story`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(story),
  })
  if (!res.ok) throw new Error(`Failed to save story: ${res.status}`)
  return res.json()
}

export type PublishResponse = {
  events?: number
  warnings?: string[]
  status?: string
}

export async function publishStory(story: Story, token?: string): Promise<PublishResponse> {
  const res = await fetch(`${BASE_URL}/story/publish`, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(story),
  })
  if (!res.ok) throw new Error(`Failed to publish story: ${res.status}`)
  return res.json()
}

export async function fetchTimeline(token?: string) {
  const res = await fetch(`${BASE_URL}/timeline`, { headers: buildHeaders(token) })
  if (!res.ok) throw new Error(`Failed to fetch timeline: ${res.status}`)
  return res.json()
}
