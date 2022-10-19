import {ObjectSchemaType} from '@sanity/types'

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
  schemaType: ObjectSchemaType
): {type?: 'dialog' | 'popover'; width: (number | 'auto')[]} | undefined {
  const raw = schemaType.options?.modal
  return typeof raw === 'object' && raw !== null
    ? {
        type: parseModalType(raw.type),
        width: parseResponsiveWidth(raw.width),
      }
    : undefined
}
