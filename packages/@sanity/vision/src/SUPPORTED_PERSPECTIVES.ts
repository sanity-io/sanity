import {type ClientPerspective} from '@sanity/client'

export type SupportedPerspective = 'raw' | 'previewDrafts' | 'published' | 'drafts'

export const SUPPORTED_PERSPECTIVES = [
  'raw',
  'previewDrafts',
  'published',
  'drafts',
] satisfies ClientPerspective[]
export const DEFAULT_PERSPECTIVE = SUPPORTED_PERSPECTIVES[0]

export function isSupportedPerspective(p: string): p is SupportedPerspective {
  return SUPPORTED_PERSPECTIVES.includes(p as SupportedPerspective)
}
