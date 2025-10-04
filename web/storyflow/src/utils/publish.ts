import type { Story } from '../types/story'

export type PublishSummary = {
  events: number
  warnings: string[]
  status: string
}

export function normalizePublishResponse(response: unknown): PublishSummary {
  const events = typeof (response as any)?.events === 'number' ? (response as any).events : 0
  const warnings = Array.isArray((response as any)?.warnings)
    ? ((response as any).warnings as string[])
    : []
  const status = typeof (response as any)?.status === 'string' ? (response as any).status : 'ok'
  return { events, warnings, status }
}

export function derivePublishWarnings(story: Story): string[] {
  const warnings: string[] = []
  for (const beat of story.beats) {
    if (!beat.zone) warnings.push(`Beat “${beat.title}” is missing a zone.`)
    if (!beat.roles?.length) warnings.push(`Beat “${beat.title}” has no assigned roles.`)
  }
  for (const cue of story.cues) {
    if (!cue.trigger) warnings.push(`Cue “${cue.id}” missing trigger.`)
    if (cue.type.startsWith('lighting') && (cue as any).args?.level === undefined) {
      warnings.push(`Lighting cue “${cue.id}” missing level.`)
    }
  }
  return warnings
}

