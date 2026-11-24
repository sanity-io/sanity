import {type InferredParam, type ParamKind, type ParamType} from './paramInference'

const ANY: ParamType = {kind: 'any', array: false}
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function kindOf(value: unknown): ParamKind {
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'any'
}

/** What a value already in the params says about its type, for keys the query does not read */
export function typeFromValue(value: unknown): ParamType {
  if (Array.isArray(value)) {
    const kinds = new Set(value.map(kindOf))
    const [kind] = kinds
    return kinds.size === 1 && kind !== 'any' ? {kind, array: true} : ANY
  }
  const kind = kindOf(value)
  if (kind === 'string' && typeof value === 'string' && ISO_DATETIME.test(value)) {
    return {kind, array: false, format: 'datetime'}
  }
  return kind === 'any' ? ANY : {kind, array: false}
}

/**
 * Whether a param is edited as an object: the query reads its keys and it holds an object, or
 * nothing yet. An untyped param keeps its JSON input, which would otherwise turn into the object
 * editor halfway through typing an object into it.
 */
export function isObjectParam(param: InferredParam, value: unknown, isSet: boolean): boolean {
  if (param.type.kind !== 'any' || param.type.array || !param.fields?.length) return false
  return !isSet || isPlainObject(value)
}

/**
 * The keys of an object param, as params of their own: the ones the query reads (`$p.key`) first,
 * then the others its value has. A key the query does not type takes the type of its value.
 */
export function objectFields(param: InferredParam, value: unknown): InferredParam[] {
  const object = isPlainObject(value) ? value : {}
  const inferred = param.fields ?? []
  const known = new Set(inferred.map((field) => field.name))
  const fields = [
    ...inferred,
    ...Object.keys(object)
      .filter((key) => !known.has(key))
      .map((key): InferredParam => ({name: key, type: ANY, usages: []})),
  ]
  return fields.map((field) =>
    field.type.kind === 'any' && !field.type.array && Object.hasOwn(object, field.name)
      ? {...field, type: typeFromValue(object[field.name])}
      : field,
  )
}

/** One line for an object's value, like `min: 0, max: 10000` */
export function previewObject(fields: InferredParam[], value: unknown): string {
  const object = isPlainObject(value) ? value : {}
  return fields
    .filter((field) => Object.hasOwn(object, field.name))
    .map((field) => {
      const item = object[field.name]
      const text = isPlainObject(item)
        ? `{${previewObject(
            Object.keys(item).map((name) => ({name, type: ANY, usages: []})),
            item,
          )}}`
        : (JSON.stringify(item) ?? String(item))
      return `${field.name}: ${text}`
    })
    .join(', ')
}

/** The object with one key set, or removed when its value is `undefined` */
export function setObjectKey(value: unknown, key: string, next: unknown): Record<string, unknown> {
  const object = isPlainObject(value) ? value : {}
  if (next === undefined) {
    return Object.fromEntries(Object.entries(object).filter(([name]) => name !== key))
  }
  return {...object, [key]: next}
}
