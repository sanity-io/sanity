import {type PortableTextBlock} from '@sanity/types'

export type ReleaseDescription = string | PortableTextBlock[]

export function isStringDescription(
  description: ReleaseDescription | undefined,
): description is string {
  return typeof description === 'string'
}

export function isPTEDescription(
  description: ReleaseDescription | undefined,
): description is PortableTextBlock[] {
  return Array.isArray(description)
}
