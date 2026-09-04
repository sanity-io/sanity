import {type ObjectSchemaType} from '@sanity/types'

const parseResponsiveWidth = (value: unknown): (number | 'auto')[] => {
  if (Array.isArray(value)) {
    return value.flatMap(parseResponsiveWidth)
  }
  if (typeof value === 'number') {
    return [value]
  }
  return value === 'auto' ? ['auto'] : [1]
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
    // Empty arrays are defined, so they skip the edit-modal width defaults and
    // collapse the popover to content/auto width.
    width: width.length > 0 ? width : undefined,
  }
}
