import {type ObjectSchemaType} from '@sanity/types'

const parseResponsiveWidth = (value: unknown): (number | 'auto')[] => {
  if (Array.isArray(value)) {
    return value.flatMap(parseResponsiveWidth)
  }
  if (typeof value === 'number') {
    return [value]
  }
  return value === 'auto' ? ['auto'] : []
}
const parseModalType = (value: unknown): 'popover' | 'dialog' | undefined => {
  return value === 'dialog' || value === 'popover' ? value : undefined
}

export function _getModalOption(
  schemaType: ObjectSchemaType,
): {type?: 'dialog' | 'popover'; width?: (number | 'auto')[]} | undefined {
  const raw = schemaType.options?.modal
  if (typeof raw !== 'object' || raw === null) {
    return undefined
  }
  const width = parseResponsiveWidth(raw.width)
  return {
    type: parseModalType(raw.type),
    // Return `undefined` (not an empty array) when no width is configured, so the
    // edit modal components fall back to their own width defaults (popover 960px /
    // dialog 640px). An empty array is "defined" and would otherwise collapse the
    // popover to content/auto width — making e.g. a reference field inside an
    // annotation render uselessly narrow.
    width: width.length > 0 ? width : undefined,
  }
}
