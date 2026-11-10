import {
  type ArraySchemaType,
  type ObjectField,
  type ReferenceSchemaType,
  type Schema,
  type SchemaType,
} from 'sanity'

import {getDocumentTypeNames} from './documentTypes'

/** Document types described field by field; the rest are only named, to keep the prompt small */
const MAX_DETAILED_TYPES = 6
const MAX_FIELDS = 40
const MAX_LIST_VALUES = 12
/** Nested objects are described this deep, enough for `slug.current` or `image.asset` */
const MAX_DEPTH = 2

function isReferenceType(type: SchemaType): type is ReferenceSchemaType {
  for (let current: SchemaType | undefined = type; current; current = current.type) {
    if (current.name === 'reference') return 'to' in type
  }
  return false
}

function isArrayType(type: SchemaType): type is ArraySchemaType {
  return type.jsonType === 'array'
}

function isBlockType(type: SchemaType): boolean {
  for (let current: SchemaType | undefined = type; current; current = current.type) {
    if (current.name === 'block') return true
  }
  return false
}

function listValues(type: SchemaType): string | undefined {
  if (type.jsonType !== 'string' && type.jsonType !== 'number') return undefined
  const list = type.options?.list
  if (!Array.isArray(list) || list.length === 0) return undefined
  const values = list
    .slice(0, MAX_LIST_VALUES)
    .map((item: unknown) =>
      JSON.stringify(
        typeof item === 'object' && item !== null && 'value' in item ? item.value : item,
      ),
    )
  return `one of ${values.join(', ')}${list.length > MAX_LIST_VALUES ? ', …' : ''}`
}

function describeFields(fields: ObjectField[], depth: number): string {
  const shown = fields
    .slice(0, MAX_FIELDS)
    .map((field) => `${field.name}: ${describeType(field.type, depth)}`)
  return shown.join(', ') + (fields.length > MAX_FIELDS ? ', …' : '')
}

function describeType(type: SchemaType, depth: number): string {
  if (isReferenceType(type)) {
    return `reference to ${type.to.map((target) => target.name).join(' | ')}`
  }
  if (isArrayType(type)) {
    if (type.of.some(isBlockType)) return 'Portable Text (array of blocks)'
    return `array of ${type.of.map((member) => describeType(member, depth + 1)).join(' | ')}`
  }
  if (type.jsonType === 'object') {
    // Named object types such as `slug` or `image` are described by their fields too, since
    // queries reach into them (`slug.current`, `image.asset->url`)
    const fields = 'fields' in type ? type.fields : []
    if (depth >= MAX_DEPTH || fields.length === 0) return type.name
    return `${type.name} {${describeFields(fields, depth + 1)}}`
  }
  const values = listValues(type)
  return values ? `${type.name} (${values})` : type.name
}

function words(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function singular(word: string): string {
  if (word.length > 3 && word.endsWith('ies')) return `${word.slice(0, -3)}y`
  if (/(?:ses|xes|zes|ches|shes)$/.test(word)) return word.slice(0, -2)
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/**
 * The workspace's document types for a prompt that writes GROQ: the types `request` seems to be
 * about (every word of the type's name or title appears in it, plurals included) with their
 * fields, the others by name
 */
export function summarizeSchema(schema: Schema, request: string): string {
  const requested = new Set(words(request).flatMap((word) => [word, singular(word)]))
  const mentions = (text: string | undefined) => {
    const textWords = text ? words(text) : []
    return textWords.length > 0 && textWords.every((word) => requested.has(word))
  }
  const names = getDocumentTypeNames(schema).filter((name) => !name.includes('.'))
  const detailed: string[] = []
  const others: string[] = []
  for (const name of names) {
    const type = schema.get(name)
    if (!type) continue
    if (detailed.length < MAX_DETAILED_TYPES && (mentions(name) || mentions(type.title))) {
      const fields = 'fields' in type ? type.fields : []
      const title = type.title && type.title !== name ? ` (${type.title})` : ''
      detailed.push(`- ${name}${title}: ${describeFields(fields, 1)}`)
    } else {
      others.push(name)
    }
  }
  const lines = [...detailed]
  if (others.length > 0) {
    lines.push(
      `${detailed.length > 0 ? 'Other document types' : 'Document types'}: ${others.join(', ')}`,
    )
  }
  return lines.join('\n')
}
