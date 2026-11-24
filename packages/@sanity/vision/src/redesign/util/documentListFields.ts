import {type ObjectField, type Schema, type SchemaType} from 'sanity'

import {type AvailableRowFields} from './documentListResult'
import {isArrayType, isBlockType, isReferenceType, words} from './schemaSummary'

/** Fields of a preview `select` beyond title, subtitle and media, offered for the subtitle */
const MAX_SUBTITLE_FIELDS = 4

/** Words in an image field's name that suggest a small picture, which suits a row's thumbnail */
const THUMBNAIL_WORDS = new Set([
  'thumb',
  'thumbnail',
  'avatar',
  'icon',
  'logo',
  'portrait',
  'headshot',
  'photo',
  'picture',
  'profile',
  'image',
])
/** Words that suggest a large picture, cropped hard to a row's square */
const HERO_WORDS = new Set([
  'hero',
  'cover',
  'banner',
  'background',
  'header',
  'splash',
  'og',
  'opengraph',
  'social',
  'share',
])

/**
 * Values a row can show as text once `string()` converts them: the Documents view only reads string
 * subtitles, and `array::join` gives null for an array with anything else in it
 */
const STRINGIFIED_JSON_TYPES = new Set(['number', 'boolean'])

/** The row attributes for one document type, as GROQ expressions on its documents */
export interface DocumentListFields {
  type: string
  title: string | undefined
  /** One expression, or several to combine into one line */
  subtitle: string[]
  /** An image field, projected as it is; undefined when the type has none */
  media: string | undefined
}

function fieldsOf(type: SchemaType | undefined): ObjectField[] {
  return type && 'fields' in type && Array.isArray(type.fields) ? type.fields : []
}

function isTypeNamed(type: SchemaType | undefined, name: string): boolean {
  for (let current = type; current; current = current.type) {
    if (current.name === name) return true
  }
  return false
}

function isImageType(type: SchemaType | undefined): boolean {
  return isTypeNamed(type, 'image')
}

interface ResolvedPath {
  expression: string
  /** The type the path ends at, when the schema knows it */
  type: SchemaType | undefined
  /** The type that holds the last attribute, when the schema knows it */
  parent: SchemaType | undefined
}

/**
 * A preview `select` path as GROQ: the preview follows references with a dot (`author.name`),
 * GROQ with an arrow (`author->name`), and array positions are indexes (`authors.0.name` is
 * `authors[0]->name`). A segment the schema does not know is kept as an attribute.
 */
export function selectPathToGroq(type: SchemaType, path: string): ResolvedPath {
  let current: SchemaType | undefined = type
  let parent: SchemaType | undefined
  let expression = ''
  for (const segment of path.split('.')) {
    if (current && isArrayType(current) && /^\d+$/.test(segment)) {
      expression += `[${segment}]`
      current = current.of.length === 1 ? current.of[0] : undefined
      continue
    }
    let separator = expression ? '.' : ''
    if (current && isReferenceType(current)) {
      separator = '->'
      current =
        current.to.find((target) => fieldsOf(target).some((field) => field.name === segment)) ??
        current.to[0]
    }
    expression += `${separator}${segment}`
    parent = current
    current = fieldsOf(current).find((field) => field.name === segment)?.type
  }
  return {expression, type: current, parent}
}

/** The path as text a row can show, or undefined when it ends at something that is not text */
function asText({expression, type}: ResolvedPath): string | undefined {
  // A path the schema cannot follow is the preview author's, and kept as written
  if (!type) return expression
  if (isReferenceType(type)) return undefined
  if (isTypeNamed(type, 'slug')) return `${expression}.current`
  if (isArrayType(type)) return type.of.some(isBlockType) ? `pt::text(${expression})` : undefined
  if (type.jsonType === 'string') return expression
  return STRINGIFIED_JSON_TYPES.has(type.jsonType) ? `string(${expression})` : undefined
}

/** The path as an image field, or undefined when it does not end at one */
function asImage(resolved: ResolvedPath): string | undefined {
  if (isImageType(resolved.type)) return resolved.expression
  // A guessed preview selects `image.asset`; the row wants the image, with its crop and hotspot
  if (isImageType(resolved.parent) && resolved.expression.endsWith('.asset')) {
    return resolved.expression.slice(0, -'.asset'.length)
  }
  return undefined
}

function rankImageField(field: ObjectField): number {
  const nameWords = words(field.name)
  if (nameWords.some((word) => HERO_WORDS.has(word))) return 2
  return nameWords.some((word) => THUMBNAIL_WORDS.has(word)) ? 0 : 1
}

/**
 * The image a row shows at about 34 pixels square: the preview's media when it is an image, unless
 * it looks like a hero image and the type also has a thumbnail-like one
 */
function pickMedia(type: SchemaType, previewMedia: string | undefined): string | undefined {
  const images = fieldsOf(type)
    .filter((field) => isImageType(field.type))
    .toSorted((a, b) => rankImageField(a) - rankImageField(b))
  const preferred = images[0]
  if (previewMedia) {
    const previewField = images.find((field) => field.name === previewMedia)
    if (!previewField || !preferred || rankImageField(previewField) <= rankImageField(preferred)) {
      return previewMedia
    }
  }
  return preferred?.name
}

function readSelect(type: SchemaType): Record<string, string> {
  const preview = 'preview' in type ? type.preview : undefined
  const select = preview && typeof preview === 'object' ? preview.select : undefined
  if (!select || typeof select !== 'object') return {}
  return Object.fromEntries(
    Object.entries(select).filter((entry): entry is [string, string] => {
      const [, path] = entry
      return typeof path === 'string' && path.length > 0
    }),
  )
}

/**
 * What a document list row of a type shows, derived from the type's preview config (declared, or
 * the one the schema guesses from its fields): its title, its subtitle (or description), and the
 * other fields a `prepare` function combines, which are offered for the subtitle since a row is
 * wide. System attributes are left to the preview; a row has its own dates.
 */
export function getDocumentListFields(schema: Schema, typeName: string): DocumentListFields {
  const type = schema.get(typeName)
  if (!type) return {type: typeName, title: undefined, subtitle: [], media: undefined}
  const select = readSelect(type)
  const text = (path: string | undefined) =>
    path ? asText(selectPathToGroq(type, path)) : undefined

  const title = text(select.title)
  const subtitle: string[] = []
  const addSubtitle = (expression: string | undefined) => {
    if (expression && expression !== title && !subtitle.includes(expression)) {
      subtitle.push(expression)
    }
  }
  addSubtitle(text(select.subtitle ?? select.description))
  for (const [key, path] of Object.entries(select)) {
    if (subtitle.length >= MAX_SUBTITLE_FIELDS) break
    if (['title', 'subtitle', 'description', 'media'].includes(key) || path.startsWith('_')) {
      continue
    }
    addSubtitle(text(path))
  }

  const previewMedia = select.media ? asImage(selectPathToGroq(type, select.media)) : undefined
  return {type: typeName, title, subtitle, media: pickMedia(type, previewMedia)}
}

/**
 * Which row attributes the previews of the types offer, so a list that already has what its types
 * can give is not offered another rewrite; every attribute when no type is known
 */
export function getAvailableRowFields(schema: Schema, typeNames: string[]): AvailableRowFields {
  const known = typeNames.filter((name) => schema.get(name))
  if (known.length === 0) return {title: true, subtitle: true, media: true}
  const fields = known.map((name) => getDocumentListFields(schema, name))
  return {
    title: fields.some((field) => field.title !== undefined),
    subtitle: fields.some((field) => field.subtitle.length > 0),
    media: fields.some((field) => field.media !== undefined),
  }
}

function describeFields(fields: DocumentListFields): string {
  const parts: string[] = []
  if (fields.title) parts.push(`"title": ${fields.title}`)
  if (fields.subtitle.length === 1) parts.push(`"subtitle": ${fields.subtitle[0]}`)
  if (fields.subtitle.length > 1) {
    parts.push(`"subtitle" combining ${fields.subtitle.join(', ')}`)
  }
  parts.push(fields.media ? `"media": ${fields.media}` : 'no image, so leave "media" out')
  return `- ${fields.type}: ${parts.join('; ')}`
}

/**
 * The row attributes of each type, one per line, for a prompt that writes a document list; an
 * empty string for no types
 */
export function describeDocumentListFields(schema: Schema, typeNames: string[]): string {
  if (typeNames.length === 0) return ''
  const lines = typeNames.map((name) => describeFields(getDocumentListFields(schema, name)))
  return `The row attributes of those document types, from their previews:\n${lines.join('\n')}`
}
