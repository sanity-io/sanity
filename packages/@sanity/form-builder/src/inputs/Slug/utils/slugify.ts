import {SlugSchemaType} from '@sanity/types'
import speakingurl from 'speakingurl'

// Fallback slugify function if not defined in field options
const defaultSlugify = (value: any, type: SlugSchemaType): string => {
  const maxLength = type.options?.maxLength
  const slugifyOpts = {truncate: typeof maxLength === 'number' ? maxLength : 200, symbols: true}
  return value ? speakingurl(value, slugifyOpts) : ''
}

export function slugify(sourceValue: any, type: SlugSchemaType): Promise<string> {
  if (!sourceValue) {
    return Promise.resolve(sourceValue)
  }

  const slugifier = type.options?.slugify || defaultSlugify

  return Promise.resolve(slugifier(sourceValue, type))
}
