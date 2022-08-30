import {ObjectSchemaTypeWithOptions, SchemaType} from '@sanity/types'

export function hasConditionalFields(type: SchemaType) {
  return typeof type.readOnly === 'function' || typeof type.hidden === 'function'
}

interface CollapsibleOptions {
  collapsible: boolean
  collapsed: boolean
}
export function getCollapsedWithDefaults(
  options: ObjectSchemaTypeWithOptions['options'] = {},
  level: number
): CollapsibleOptions {
  if (options.collapsible === true || options.collapsable === true) {
    // collapsible explicit set to true
    return {
      collapsible: true,
      collapsed: options.collapsed !== false,
    }
  } else if (options.collapsible === false || options.collapsable === false) {
    // collapsible explicit set to false
    return {
      // hard limit to avoid infinite recursion
      collapsible: level > 9,
      collapsed: level > 9,
    }
  }
  // default
  return {
    collapsible: level > 2,
    collapsed: level > 2,
  }
}
