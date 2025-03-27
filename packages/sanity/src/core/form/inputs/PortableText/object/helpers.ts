import {type ObjectSchemaType} from '@sanity/types'
import {type ContainerWidth} from '@sanity/ui/theme'

const parseResponsiveWidth = (value: unknown): ContainerWidth[] => {
  if (Array.isArray(value)) {
    return value.flatMap(parseResponsiveWidth)
  }
  if (typeof value === 'number') {
    return [value as ContainerWidth]
  }
  return value === 'auto' ? ['auto'] : []
}
const parseModalType = (value: unknown): 'popover' | 'dialog' | undefined => {
  return value === 'dialog' || value === 'popover' ? value : undefined
}

export function _getModalOption(
  schemaType: ObjectSchemaType,
): {type?: 'dialog' | 'popover'; width: ContainerWidth[]} | undefined {
  const raw = schemaType.options?.modal
  return typeof raw === 'object' && raw !== null
    ? {
        type: parseModalType(raw.type),
        width: parseResponsiveWidth(raw.width),
      }
    : undefined
}
