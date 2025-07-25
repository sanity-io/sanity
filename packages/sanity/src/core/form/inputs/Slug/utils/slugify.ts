import {type SlugSchemaType, type SlugSourceContext} from '@sanity/types'
import speakingurl from 'speakingurl'

import {type FIXME} from '../../../../FIXME'

// Fallback slugify function if not defined in field options
const defaultSlugify = (value: FIXME, type: SlugSchemaType): string => {
  const maxLength = type.options?.maxLength
  const slugifyOpts = {truncate: typeof maxLength === 'number' ? maxLength : 200, symbols: true}
  return value ? speakingurl(value, slugifyOpts) : ''
}

export async function slugify(
  sourceValue: FIXME,
  type: SlugSchemaType,
  context: SlugSourceContext,
): Promise<string> {
  if (!sourceValue) {
    return sourceValue
  }

  const slugifier = type.options?.slugify || defaultSlugify
  return slugifier(sourceValue, type, context)
}
