import {
  type EncodableObject,
  type EncodableValue,
  SetBuilder,
  type SetSynchronization,
} from '@sanity/descriptors'
import {
  type ArraySchemaType,
  type FieldGroupDefinition,
  type FieldsetDefinition,
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type Schema,
  type SchemaType,
} from '@sanity/types'

import {OWN_PROPS_NAME} from '../legacy/types/constants'
import {
  type ArrayTypeDef,
  type CommonTypeDef,
  type CoreTypeDef,
  type CyclicMarker,
  type DepthMarker,
  type FunctionMarker,
  type JSXMarker,
  type ObjectField,
  type ObjectFieldset,
  type ObjectGroup,
  type ReferenceTypeDef,
  type RegistryType,
  type SubtypeDef,
  type TypeDef,
  type UndefinedMarker,
  type UnknownMarker,
} from './types'

const MAX_DEPTH_UKNOWN = 5

type UnknownRecord<T> = {[P in keyof T]: unknown}

export class DescriptorConverter {
  opts: Options
  cache: WeakMap<Schema, SetSynchronization<RegistryType>> = new WeakMap()

  constructor(opts: Options) {
    this.opts = opts
  }

  /**
   * Returns a synchronization object for a schema.
   *
   * This is automatically cached in a weak map.
   */
  get(schema: Schema): SetSynchronization<RegistryType> {
    let value = this.cache.get(schema)
    if (value) return value

    const builder = new SetBuilder()
    for (const name of schema.getLocalTypeNames()) {
      const typeDef = convertTypeDef(schema.get(name)!, this.opts)
      builder.addObject('sanity.schema.namedType', {name, typeDef})
    }

    if (schema.parent) {
      builder.addSet(this.get(schema.parent))
    }

    value = builder.build('sanity.schema.registry')
    this.cache.set(schema, value)
    return value
  }
}

function convertCommonTypeDef(schemaType: SchemaType, opts: Options): CommonTypeDef {
  // Note that OWN_PROPS_NAME is only set on subtypes, not the core types.
  // We might consider setting OWN_PROPS_NAME on _all_ types to avoid this branch.
  const ownProps = OWN_PROPS_NAME in schemaType ? (schemaType as any)[OWN_PROPS_NAME] : schemaType

  let fields: ObjectField[] | undefined
  if (Array.isArray(ownProps.fields)) {
    fields = (ownProps.fields as ObjectSchemaType['fields']).map(
      ({name, group, fieldset, type}) => ({
        name,
        typeDef: convertTypeDef(type, opts),
        groups: arrayifyString(group),
        fieldset,
      }),
    )
  }

  let fieldsets: ObjectFieldset[] | undefined
  if (Array.isArray(ownProps.fieldsets)) {
    fieldsets = filterStringKey(
      'name',
      (ownProps.fieldsets as Array<UnknownRecord<FieldsetDefinition>>).map(
        ({name, title, description, group, hidden, readOnly, options}) => ({
          name,
          title: maybeString(title),
          description: maybeString(description),
          group: maybeString(group),
          hidden: conditionalTrue(hidden),
          readOnly: conditionalTrue(readOnly),
          options: convertUnknown(options),
        }),
      ),
    )
  }

  let groups: ObjectGroup[] | undefined
  if (Array.isArray(ownProps.groups)) {
    groups = filterStringKey(
      'name',
      (ownProps.groups as Array<UnknownRecord<FieldGroupDefinition>>).map(
        ({name, title, hidden, default: def}) => ({
          name,
          title: maybeString(title),
          hidden: conditionalTrue(hidden),
          default: maybeTrue(def),
        }),
      ),
    )
  }

  const reason = ownProps.deprecated?.reason

  return {
    title: maybeString(ownProps.title),
    description: maybeStringOrJSX(ownProps.description),
    readOnly: conditionalTrue(ownProps.readOnly),
    hidden: conditionalTrue(ownProps.hidden),
    liveEdit: maybeTrue(ownProps.liveEdit),
    options: convertUnknown(ownProps.options),
    initialValue: convertUnknown(ownProps.initialValue),
    deprecated: typeof reason === 'string' ? {reason} : undefined,
    placeholder: maybeString(ownProps.placeholder),
    rows: maybeNumberAsString(ownProps.rows),
    fields,
    fieldsets,
    groups,
  }
}

/**
 * Options used when converting the schema.
 *
 * We know we need this in order to handle validations.
 **/
export type Options = Record<never, never>

export function convertTypeDef(schemaType: SchemaType, opts: Options): TypeDef {
  const common = convertCommonTypeDef(schemaType, opts)

  if (!schemaType.type) {
    return {
      extends: null,
      jsonType: schemaType.jsonType,
      ...common,
    } satisfies CoreTypeDef
  }

  // The types below are somewhat magical: It's only direct subtypes of array/reference which
  // are allowed to have of/to assigned to them. We handle them specifically here since this
  // gives us more control over the types.

  switch (schemaType.type.name) {
    case 'array': {
      return {
        extends: 'array',
        of: (schemaType as ArraySchemaType).of.map((ofType) => ({
          name: ofType.name,
          typeDef: convertTypeDef(ofType, opts),
        })),
        ...common,
      } satisfies ArrayTypeDef
    }
    case 'reference':
    case 'globalDocumentReference':
    case 'crossDatasetReference':
      return {
        extends: schemaType.type.name,
        to: filterStringKey(
          'name',
          (schemaType as ReferenceSchemaType).to
            // The `toType.type` case is for crossDatasetReferences/crossDatasetReference
            .map((toType) => ({name: toType.name || toType.type?.name || toType.type})),
        ),
        ...common,
      } satisfies ReferenceTypeDef
    default:
      return {extends: schemaType.type.name, ...common} satisfies SubtypeDef
  }
}

function maybeString(val: unknown): string | undefined {
  return typeof val === 'string' ? val : undefined
}

function maybeNumberAsString(val: unknown): string | undefined {
  return typeof val === 'number' ? val.toString() : undefined
}

/** Returns `true` for `true` and undefined for everything else. */
function maybeTrue(val: unknown): true | undefined {
  return val === true ? true : undefined
}

function conditionalTrue(val: unknown): true | undefined | FunctionMarker {
  if (typeof val === 'function') return FUNCTION_MARKER
  return maybeTrue(val)
}

function filterStringKey<T, K extends keyof T>(key: K, arr: T[]): Array<T & {[key in K]: string}> {
  return arr.filter((obj): obj is T & {[key in K]: string} => typeof obj[key] === 'string')
}

function arrayifyString(val: unknown): string[] | undefined {
  if (typeof val === 'string') {
    return [val]
  }

  if (Array.isArray(val)) {
    return val.filter((elem) => typeof elem === 'string')
  }

  return undefined
}

const FUNCTION_MARKER: FunctionMarker = {__type: 'function'}
const UNKNOWN_MARKER: UnknownMarker = {__type: 'unknown'}
const UNDEFINED_MARKER: UndefinedMarker = {__type: 'undefined'}
const CYCLIC_MARKER: CyclicMarker = {__type: 'cyclic'}
const MAX_DEPTH_MARKER: DepthMarker = {__type: 'maxDepth'}

function convertUnknown(
  val: unknown,
  seen = new Set(),
  maxDepth = MAX_DEPTH_UKNOWN,
): EncodableValue | undefined {
  if (maxDepth === 0) return MAX_DEPTH_MARKER

  if (typeof val === 'string' || typeof val === 'boolean' || val === null || val === undefined) {
    return val
  }

  if (typeof val === 'number') {
    return {__type: 'number', value: val.toString()}
  }

  if (typeof val === 'function') return FUNCTION_MARKER

  if (seen.has(val)) {
    return CYCLIC_MARKER
  }

  seen.add(val)

  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map((elem) => {
        const res = convertUnknown(elem, seen, maxDepth - 1)
        return res === undefined ? UNDEFINED_MARKER : res
      })
    }

    if ('$$typeof' in val && 'type' in val && 'props' in val) {
      // React element:
      const {type, props} = val
      const strType = typeof type === 'function' ? type.name : type
      if (typeof strType !== 'string') return undefined
      return {
        __type: 'jsx',
        type: strType,
        props: convertUnknown(props, seen, maxDepth - 1) as EncodableObject,
      }
    }

    let hasType = false
    const result: EncodableObject = {}
    for (const [key, field] of Object.entries(val)) {
      if (key === '__type') hasType = true
      result[key] = convertUnknown(field, seen, maxDepth - 1)
    }

    return hasType ? {__type: 'object', value: result} : result
  }

  return UNKNOWN_MARKER
}

function maybeStringOrJSX(val: unknown): string | undefined | JSXMarker {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object' && '$$typeof' in val && 'type' in val && 'props' in val) {
    const {type, props} = val
    const strType = typeof type === 'function' ? type.name : type
    if (typeof strType !== 'string') return undefined
    return {__type: 'jsx', type: strType, props: convertUnknown(props) as EncodableObject}
  }
  return undefined
}
