import {type ClientPerspective} from '@sanity/client'

export const PERSPECTIVES = ['raw', 'previewDrafts', 'published'] satisfies ClientPerspective[]
export const DEFAULT_PERSPECTIVE = PERSPECTIVES[0]

export function isPerspective(p: string): p is ClientPerspective {
  return PERSPECTIVES.includes(p as ClientPerspective)
}
