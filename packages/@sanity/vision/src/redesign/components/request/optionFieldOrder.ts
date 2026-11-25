/**
 * The order of the Options panel's fields. The query bar's chips follow it too, so the chips read
 * in the same order as the fields they reveal.
 */
export const OPTION_FIELD_ORDER = [
  'apiVersion',
  'dataset',
  'perspective',
  'variant',
  'caching',
  'sourceMap',
] as const

export type OptionField = (typeof OPTION_FIELD_ORDER)[number]
