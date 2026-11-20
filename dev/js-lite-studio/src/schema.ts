/**
 * The workspace schema, read from the schema the studio deploys to the dataset
 * (`_.schemas.default`, the manifest format `sanity schema deploy` writes), like the Rust
 * studio's `schema.rs`, so both edit exactly the types the JS studio defines.
 */
import {isObject, type Json, type JsonObject, previewText, randomKey, startCase} from './util'

export interface TitledValue {
  value: string
  title?: string
}

export interface TypeDef {
  name: string
  type: string
  title?: string
  description?: string
  fields?: TypeDef[]
  of?: TypeDef[]
  to?: {type: string}[]
  options?: JsonObject
  validation?: {level?: string; rules?: {flag: string; constraint?: Json}[]}[]
  hidden?: Json
  readOnly?: Json
  rows?: number
  placeholder?: string
  fieldset?: string
  fieldsets?: {name: string; title?: string; options?: JsonObject}[]
  initialValue?: Json
  styles?: TitledValue[]
  lists?: TitledValue[]
  marks?: {decorators?: TitledValue[]; annotations?: TypeDef[]}
}

export type Kind =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'url'
  | 'email'
  | 'date'
  | 'datetime'
  | 'slug'
  | 'reference'
  | 'crossDatasetReference'
  | 'array'
  | 'object'
  | 'image'
  | 'file'
  | 'geopoint'
  | 'block'
  | 'document'
  | 'unknown'

const BUILTINS: Record<string, Kind> = {
  'string': 'string',
  'text': 'text',
  'number': 'number',
  'boolean': 'boolean',
  'url': 'url',
  'email': 'email',
  'date': 'date',
  'datetime': 'datetime',
  'slug': 'slug',
  'reference': 'reference',
  'crossDatasetReference': 'crossDatasetReference',
  'globalDocumentReference': 'crossDatasetReference',
  'array': 'array',
  'object': 'object',
  'image': 'image',
  'file': 'file',
  'sanity.video': 'file',
  'geopoint': 'geopoint',
  'block': 'block',
  'document': 'document',
}

function builtin(name: string): Kind | undefined {
  return Object.hasOwn(BUILTINS, name) ? BUILTINS[name] : undefined
}

export function isStringish(kind: Kind): boolean {
  return (
    kind === 'string' || kind === 'text' || kind === 'url' || kind === 'email' || kind === 'slug'
  )
}

/** Whether values are JSON objects (`isObjectSchemaType`). */
export function isObjectKind(kind: Kind): boolean {
  return (
    kind === 'object' ||
    kind === 'document' ||
    kind === 'image' ||
    kind === 'file' ||
    kind === 'geopoint' ||
    kind === 'slug' ||
    kind === 'reference' ||
    kind === 'crossDatasetReference' ||
    kind === 'block'
  )
}

/**
 * A definition with named types followed down to a built-in: the kind, plus the fields, members
 * and options of the nearest definition that declares them.
 */
export interface Resolved {
  kind: Kind
  def: TypeDef
  fields: TypeDef[]
  fieldsets: NonNullable<TypeDef['fieldsets']>
  of: TypeDef[]
  to: string[]
  options: JsonObject | undefined
  /** The `_type` of values of this definition: the named type, or the built-in name. */
  typeName: string
}

export interface BlockConfig {
  styles: TitledValue[]
  lists: TitledValue[]
  decorators: TitledValue[]
  annotations: TypeDef[]
  inline: TypeDef[]
}

export interface Preview {
  title?: string
  subtitle?: string
  media?: string
}

export interface Marker {
  level: string
  message: string
}

const TITLE_CANDIDATES = ['title', 'name', 'label', 'heading', 'header', 'caption']
const SUBTITLE_CANDIDATES = [
  'description',
  'subtitle',
  'title',
  'name',
  'label',
  'heading',
  'header',
]
const TITLE_FALLBACK = 'coalesce(title, name, label, heading, header, caption)'
/** `DEFAULT_MAX_RECURSION_DEPTH` of the initial value resolver. */
const INITIAL_VALUE_DEPTH = 10

const titled = (items: [string, string][]): TitledValue[] =>
  items.map(([value, title]) => ({value, title}))

export function titleOf(def: {name: string; title?: string}): string {
  return def.title || startCase(def.name)
}

export function titledValueTitle(item: TitledValue): string {
  return item.title || startCase(item.value)
}

/** The `_type` of a new array member: its name, or the type it is declared as. */
export function memberTypeName(member: TypeDef): string {
  return member.name || member.type
}

export function isHidden(def: TypeDef): boolean {
  return def.hidden === true
}

export function isReadOnly(def: TypeDef): boolean {
  return def.readOnly === true
}

export class Schema {
  private types = new Map<string, TypeDef>()
  private previews = new Map<string, Preview>()
  readonly documentTypes: TypeDef[]

  constructor(manifest: unknown) {
    const defs = Array.isArray(manifest) ? (manifest as TypeDef[]) : []
    for (const def of defs) this.types.set(def.name, def)
    this.documentTypes = [...this.types.values()]
      .filter(
        (def) =>
          def.type === 'document' &&
          !def.name.startsWith('sanity.') &&
          !def.name.startsWith('system.'),
      )
      .toSorted((a, b) => {
        const [left, right] = [titleOf(a).toLowerCase(), titleOf(b).toLowerCase()]
        return left < right ? -1 : left > right ? 1 : 0
      })
    for (const def of this.documentTypes) {
      this.previews.set(def.name, this.guessFieldsPreview(def.fields ?? []))
    }
  }

  get(name: string): TypeDef | undefined {
    return this.types.get(name)
  }

  typeTitle(name: string): string {
    const def = this.types.get(name)
    return def ? titleOf(def) : startCase(name)
  }

  preview(typeName: string): Preview {
    return this.previews.get(typeName) ?? {}
  }

  /**
   * A GROQ projection of the preview of documents of any of `types`: `title` and `subtitle` hold
   * the raw field values, `media` an image asset reference.
   */
  previewProjection(types: string[]): string {
    const select = (pick: (preview: Preview) => string | undefined, fallback: string) => {
      const arms = types.flatMap((name) => {
        const field = pick(this.preview(name))
        return field ? [`_type == ${JSON.stringify(name)} => ${field}`] : []
      })
      if (arms.length === 0) return fallback
      if (arms.length === 1 && types.length === 1) return pick(this.preview(types[0])) ?? ''
      return `select(${arms.join(', ')}, ${fallback})`
    }
    const title = select((preview) => preview.title, TITLE_FALLBACK)
    const subtitle = select((preview) => preview.subtitle, 'null')
    const media = select(
      (preview) => (preview.media ? `${preview.media}.asset._ref` : undefined),
      'null',
    )
    return `{_id, _originalId, _type, _updatedAt, "title": ${title}, "subtitle": ${subtitle}, "media": ${media}}`
  }

  /** The preview title fields of `types`, each with the types that use it, in order of first use. */
  titleFields(types: string[]): [string, string[]][] {
    const fields: [string, string[]][] = []
    for (const name of types) {
      const field = this.preview(name).title
      if (!field) continue
      const existing = fields.find(([candidate]) => candidate === field)
      if (existing) existing[1].push(name)
      else fields.push([field, [name]])
    }
    return fields
  }

  resolve(def: TypeDef): Resolved {
    const nonEmpty = <T>(items: T[] | undefined) => (items && items.length > 0 ? items : undefined)
    let fields = nonEmpty(def.fields)
    let fieldsets = nonEmpty(def.fieldsets)
    let of = nonEmpty(def.of)
    let to = (def.to ?? []).map((target) => target.type)
    let options = def.options
    let current = def.type
    let kind = builtin(current)
    let depth = 0
    while (!kind && depth < 16) {
      const named = this.types.get(current)
      if (!named) break
      fields = fields ?? nonEmpty(named.fields)
      fieldsets = fieldsets ?? nonEmpty(named.fieldsets)
      of = of ?? nonEmpty(named.of)
      if (to.length === 0) to = (named.to ?? []).map((target) => target.type)
      options = options ?? named.options
      current = named.type
      kind = builtin(current)
      depth++
    }
    return {
      kind: kind ?? 'unknown',
      def,
      fields: fields ?? [],
      fieldsets: fieldsets ?? [],
      of: of ?? [],
      to,
      options,
      typeName: def.type,
    }
  }

  /**
   * The block configuration of `def`, each part from the nearest definition that declares it,
   * with the defaults `@sanity/schema` gives a plain `{type: 'block'}`.
   */
  blockConfig(def: TypeDef): BlockConfig {
    const chain = [def]
    let current = def.type
    while (!builtin(current) && chain.length < 16) {
      const named = this.types.get(current)
      if (!named) break
      chain.push(named)
      current = named.type
    }
    const pick = (
      get: (def: TypeDef) => TitledValue[] | undefined,
      fallback: [string, string][],
    ) => {
      for (const item of chain) {
        const value = get(item)
        if (value) return value
      }
      return titled(fallback)
    }
    return {
      styles: pick(
        (item) => item.styles,
        [
          ['normal', 'Normal'],
          ['h1', 'Heading 1'],
          ['h2', 'Heading 2'],
          ['h3', 'Heading 3'],
          ['h4', 'Heading 4'],
          ['h5', 'Heading 5'],
          ['h6', 'Heading 6'],
          ['blockquote', 'Quote'],
        ],
      ),
      lists: pick(
        (item) => item.lists,
        [
          ['bullet', 'Bulleted list'],
          ['number', 'Numbered list'],
        ],
      ),
      decorators: pick(
        (item) => item.marks?.decorators,
        [
          ['strong', 'Strong'],
          ['em', 'Italic'],
          ['code', 'Code'],
          ['underline', 'Underline'],
          ['strike-through', 'Strike'],
        ],
      ),
      annotations: chain.find((item) => item.marks?.annotations)?.marks?.annotations ?? [
        {name: 'link', type: 'object', title: 'Link', fields: [{name: 'href', type: 'url'}]},
      ],
      inline: chain.find((item) => item.of && item.of.length > 0)?.of ?? [],
    }
  }

  /**
   * The initial value of a new document of `typeName` (`resolveInitialValueForType`). The
   * deployed schema only keeps static initial values, so resolver functions are left out.
   */
  initialDocument(typeName: string): JsonObject | undefined {
    const def = this.types.get(typeName)
    if (!def) return undefined
    const value = this.initialValue(def, typeName, INITIAL_VALUE_DEPTH)
    return isObject(value) ? value : undefined
  }

  private initialValue(def: TypeDef, typeName: string, depth: number): Json | undefined {
    if (depth === 0) return undefined
    const resolved = this.resolve(def)
    const own = this.ownInitialValue(def)
    if (resolved.kind === 'array') {
      if (!Array.isArray(own)) return undefined
      return own.map((item) => {
        if (!isObject(item)) return item
        const itemType = typeof item._type === 'string' ? item._type : 'object'
        const member =
          itemType === 'object' && resolved.of.length === 1
            ? resolved.of[0]
            : resolved.of.find((candidate) => memberTypeName(candidate) === itemType)
        if (!member || !isObjectKind(this.resolve(member).kind)) return item
        // The array's own initial items win over the initial values of their type.
        const initial = this.initialValue(member, memberTypeName(member), depth - 1)
        const value: JsonObject = isObject(initial) ? {...initial} : {}
        deepAssign(value, item)
        value._key = randomKey(12)
        return value
      })
    }
    if (!isObjectKind(resolved.kind)) return own
    const value: JsonObject = {}
    for (const field of resolved.fields) {
      const fieldValue = this.initialValue(field, field.type, depth - 1)
      if (fieldValue !== undefined && fieldValue !== null) value[field.name] = fieldValue
    }
    if (isObject(own)) deepAssign(value, own)
    if (isDeepEmpty(value)) return undefined
    if (typeName !== 'object') value._type = typeName
    return value
  }

  /** The `initialValue` of `def`, or else of the named type it is declared as. */
  private ownInitialValue(def: TypeDef): Json | undefined {
    let value = def.initialValue
    let current = def.type
    for (let step = 0; step < 16; step++) {
      if (value !== undefined || builtin(current)) break
      const named = this.types.get(current)
      if (!named) break
      value = named.initialValue
      current = named.type
    }
    return value
  }

  /** `guessPreviewConfig` over the fields of an object: a title-like string field, a
   * description-like subtitle, and the first image as media. */
  guessFieldsPreview(fields: TypeDef[]): Preview {
    const stringish = fields
      .filter((field) => isStringish(this.resolve(field).kind))
      .map((field) => field.name)
    const title =
      TITLE_CANDIDATES.find((candidate) => stringish.includes(candidate)) ?? stringish[0]
    const subtitle = SUBTITLE_CANDIDATES.find(
      (candidate) => stringish.includes(candidate) && candidate !== title,
    )
    const media = fields.find((field) => this.resolve(field).kind === 'image')?.name
    return {title, subtitle, media}
  }
}

/** `options.list` as `[value, title]` pairs. */
export function listOptions(resolved: Resolved): [Json, string][] | undefined {
  const list = resolved.options?.list
  if (!Array.isArray(list)) return undefined
  return list.map((item) => {
    if (isObject(item)) {
      const value = item.value ?? null
      return [value, typeof item.title === 'string' ? item.title : (previewText(value) ?? '')]
    }
    return [item, previewText(item) ?? '']
  })
}

/** `deepAssign` of the initial value resolver: `source` over `target`, merging nested objects. */
function deepAssign(target: JsonObject, source: JsonObject): void {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key]
    if (isObject(existing) && isObject(value)) {
      const merged = {...existing}
      deepAssign(merged, value)
      target[key] = merged
    } else {
      target[key] = value
    }
  }
}

/** `isDeepEmpty`: null, or objects and arrays with nothing but `_type`, `_key` and empty values. */
function isDeepEmpty(value: Json | undefined): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.every(isDeepEmpty)
  if (isObject(value)) {
    return Object.entries(value).every(
      ([key, entry]) => key === '_type' || key === '_key' || isDeepEmpty(entry),
    )
  }
  return false
}

/** The validation rules the manifest carries that do not need a function to evaluate. */
export function validate(resolved: Resolved, value: unknown): Marker[] {
  const markers: Marker[] = []
  const empty =
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value === '') ||
    (Array.isArray(value) && value.length === 0)
  for (const group of resolved.def.validation ?? []) {
    const level = group.level || 'error'
    const push = (message: string) => markers.push({level, message})
    for (const rule of group.rules ?? []) {
      if (rule.flag === 'presence' && rule.constraint === 'required' && empty) {
        push('Required')
        continue
      }
      if (empty) continue
      switch (rule.flag) {
        case 'min':
        case 'max':
        case 'length': {
          const limit = rule.constraint
          if (typeof limit !== 'number') break
          let measure: number
          let unit: string | undefined
          if (typeof value === 'string') [measure, unit] = [[...value].length, 'characters']
          else if (Array.isArray(value)) [measure, unit] = [value.length, 'items']
          else if (typeof value === 'number') measure = value
          else break
          let message: string | undefined
          if (unit) {
            if (rule.flag === 'min' && measure < limit)
              message = `Must have at least ${limit} ${unit}`
            if (rule.flag === 'max' && measure > limit)
              message = `Must have at most ${limit} ${unit}`
            if (rule.flag === 'length' && measure !== limit) {
              message = `Must have exactly ${limit} ${unit}`
            }
          } else {
            if (rule.flag === 'min' && measure < limit) {
              message = `Must be greater than or equal to ${limit}`
            }
            if (rule.flag === 'max' && measure > limit)
              message = `Must be less than or equal to ${limit}`
          }
          if (message) push(message)
          break
        }
        case 'integer':
          if (typeof value === 'number' && !Number.isInteger(value)) push('Must be an integer')
          break
        case 'email':
          if (typeof value === 'string' && (!value.includes('@') || value.includes(' '))) {
            push('Must be a valid email address')
          }
          break
        case 'uri':
          if (typeof value === 'string' && !value.includes(':') && !value.startsWith('/')) {
            push('Not a valid URL')
          }
          break
        case 'valid':
          if (
            Array.isArray(rule.constraint) &&
            !rule.constraint.some((allowed) => JSON.stringify(allowed) === JSON.stringify(value))
          ) {
            push('Value did not match any allowed values')
          }
          break
        default:
      }
    }
  }
  return markers
}

let current = new Schema([])

/** The workspace schema; empty until it has loaded. */
export function schema(): Schema {
  return current
}

export function setSchema(next: Schema): void {
  current = next
}
