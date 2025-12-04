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
  type Rule as IRule,
  type Schema,
  type SchemaType,
} from '@sanity/types'
import {isEqual, isObject} from 'lodash'

import {Rule} from '../legacy/Rule'
import {OWN_PROPS_NAME} from '../legacy/types/constants'
import {IdleScheduler, type Scheduler, SYNC_SCHEDULER} from './scheduler'
import {
  type ArrayElement,
  type ArrayTypeDef,
  type CommonTypeDef,
  type CoreTypeDef,
  type CyclicMarker,
  type DepthMarker,
  type FieldReference,
  type FunctionMarker,
  type JSXMarker,
  type ObjectField,
  type ObjectFieldset,
  type ObjectGroup,
  type ObjectI18n,
  type ObjectI18nValue,
  type ObjectMessage,
  type ObjectOrdering,
  type ObjectOrderingBy,
  type ReferenceTypeDef,
  type RegistryType,
  type Rule as RuleType,
  type SubtypeDef,
  type TypeDef,
  type UndefinedMarker,
  type UnknownMarker,
  type Validation,
  type ValidationMessage,
} from './types'

const MAX_DEPTH_UKNOWN = 5

type UnknownRecord<T> = {[P in keyof T]: unknown}

export class DescriptorConverter {
  cache: WeakMap<Schema, SetSynchronization<RegistryType>> = new WeakMap()

  /**
   * Returns a synchronization object for a schema.
   *
   * This is automatically cached in a weak map.
   */
  async get(
    schema: Schema,
    opts?: {
      /**
       * If present, this will use an idle scheduler which records duration into this array.
       * This option will be ignored if the `scheduler` option is passed in.
       **/
      pauseDurations?: number[]

      /** An explicit scheduler to do the work. */
      scheduler?: Scheduler
    },
  ): Promise<SetSynchronization<RegistryType>> {
    /*
      Converting the schema into a descriptor consists of two parts:

      1. Traversing the type into a descriptor.
      2. Serializing the descriptor, including SHA256 hashing.

      Note that only (2) can be done in a background worker since the type
      itself isn't serializable (which is a requirement for a background
      worker). In addition, we expect (2) to scale in the same way as (1): If it
      takes X milliseconds to traverse the type into a descriptor it will
      probably take c*X milliseconds to serialize it.

      This means that a background worker actually doesn't give us that much
      value. A huge type will either way be expensive to convert from a type to
      a descriptor. Therefore this function currently only avoid blocking by
      only processing each type separately.

      If we want to minimize the blocking further we would have to restructure
      this converter to be able to convert the types asynchronously and _then_
      it might make sense to the serialization step itself in a background
      worker.
    */
    let value = this.cache.get(schema)
    if (value) return value

    let idleScheduler: IdleScheduler | undefined
    const scheduler =
      opts?.scheduler ||
      (opts?.pauseDurations
        ? (idleScheduler = new IdleScheduler(opts.pauseDurations))
        : SYNC_SCHEDULER)

    const options: Options = {
      fields: new Map(),
      duplicateFields: new Map(),
      arrayElements: new Map(),
      duplicateArrayElements: new Map(),
    }

    const namedTypes = await scheduler.map(schema.getLocalTypeNames(), (name) => {
      const typeDef = convertTypeDef(schema.get(name)!, name, options)
      return {name, typeDef}
    })

    const rewriteMap = new Map<EncodableObject, EncodableObject>()

    // First we populate the rewrite map with the duplications:
    for (const [fieldDef, key] of options.duplicateFields.entries()) {
      rewriteMap.set(fieldDef, {__type: 'hoisted', key})
    }

    for (const [arrayElem, key] of options.duplicateArrayElements.entries()) {
      rewriteMap.set(arrayElem, {__type: 'hoisted', key})
    }

    const builder = new SetBuilder({rewriteMap})

    // Now we can build the de-duplicated objects:
    await scheduler.forEachIter(options.duplicateFields.entries(), ([fieldDef, key]) => {
      builder.addObject('sanity.schema.hoisted', {key, value: {...fieldDef}})
    })

    await scheduler.forEachIter(options.duplicateArrayElements.entries(), ([arrayElem, key]) => {
      builder.addObject('sanity.schema.hoisted', {key, value: {...arrayElem}})
    })

    await scheduler.forEach(namedTypes, (namedType) => {
      builder.addObject('sanity.schema.namedType', namedType)
    })

    if (schema.parent) {
      builder.addSet(await this.get(schema.parent, {scheduler}))
    }

    value = builder.build('sanity.schema.registry')
    this.cache.set(schema, value)

    // If we created the scheduler we also need to end it.
    if (idleScheduler) idleScheduler.end()
    return value
  }
}

function convertCommonTypeDef(schemaType: SchemaType, path: string, opts: Options): CommonTypeDef {
  // Note that OWN_PROPS_NAME is only set on subtypes, not the core types.
  // We might consider setting OWN_PROPS_NAME on _all_ types to avoid this branch.
  const ownProps = OWN_PROPS_NAME in schemaType ? (schemaType as any)[OWN_PROPS_NAME] : schemaType

  let fields: ObjectField[] | undefined
  if (Array.isArray(ownProps.fields)) {
    fields = (ownProps.fields as ObjectSchemaType['fields']).map((field) => {
      const fieldPath = `${path}.${field.name}`
      const value = opts.fields.get(field)
      if (value) {
        // We've seen it before. Mark it as duplicate.
        const otherPath = opts.duplicateFields.get(value)
        // We always keep the _smallest_ path around.
        if (!otherPath || isLessCanonicalName(fieldPath, otherPath))
          opts.duplicateFields.set(value, fieldPath)
        return value
      }

      const {name, group, fieldset, type} = field
      const converted: ObjectField = {
        name,
        typeDef: convertTypeDef(type, fieldPath, opts),
        groups: arrayifyString(group),
        fieldset,
      }
      opts.fields.set(field, converted)
      return converted
    })
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
        ({name, title, hidden, default: def, i18n}) => ({
          name,
          title: maybeString(title),
          hidden: conditionalTrue(hidden),
          default: maybeTrue(def),
          i18n: maybeI18n(i18n),
        }),
      ),
    )
  }

  const reason = ownProps.deprecated?.reason

  let orderings: ObjectOrdering[] | undefined
  if (Array.isArray(ownProps.orderings)) {
    orderings = ownProps.orderings
      .map(maybeOrdering)
      .filter((o: ObjectOrdering | undefined) => o !== undefined)
  }

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
    validation: maybeValidations(ownProps),
    orderings,
  }
}

type Options = {
  /** Mapping of fields to descriptor value. Used for de-duping. */
  fields: Map<object, ObjectField>

  /**
   * Once a field has been seen twice it's inserted into this map.
   * The value here is the canonical name.
   **/
  duplicateFields: Map<ObjectField, string>

  /** Mapping of array element to descriptor value. Used for de-duping. */
  arrayElements: Map<object, ArrayElement>

  /**
   * Once an array element has been seen twice it's inserted into this map.
   * The value here is the canonical name.
   **/
  duplicateArrayElements: Map<ArrayElement, string>
}

export function convertTypeDef(schemaType: SchemaType, path: string, opts: Options): TypeDef {
  const common = convertCommonTypeDef(schemaType, path, opts)

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
        of: (schemaType as ArraySchemaType).of.map((ofType, idx) => {
          const itemPath = `${path}.${ofType.name}`
          const value = opts.arrayElements.get(ofType)
          if (value) {
            // We've seen it before. Mark it as duplicate.
            const otherPath = opts.duplicateArrayElements.get(value)
            // We always keep the _smallest_ path around.
            if (!otherPath || isLessCanonicalName(itemPath, otherPath))
              opts.duplicateArrayElements.set(value, itemPath)
            return value
          }
          const converted: ArrayElement = {
            name: ofType.name,
            typeDef: convertTypeDef(ofType, `${path}.${ofType.name}`, opts),
          }
          opts.arrayElements.set(ofType, converted)
          return converted
        }),
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

  if (isObject(val)) {
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
  if (isObject(val) && '$$typeof' in val && 'type' in val && 'props' in val) {
    const {type, props} = val
    const strType = typeof type === 'function' ? type.name : type
    if (typeof strType !== 'string') return undefined
    return {__type: 'jsx', type: strType, props: convertUnknown(props) as EncodableObject}
  }
  return undefined
}

// maybeValidations attempts to serialize the validations of a type. Note: we need the whole type object and not
// just the validation property as we need to recreate implied validations of various properties. This are technically
// inherited and thus lost since we operate on the ownProps.
function maybeValidations(obj: unknown): Validation[] | undefined {
  if (!isObject(obj) || !('type' in obj)) return undefined

  // Implied rules are rules which are inherited by the types. Since the descriptor operates on the ownProps
  // it is necessary to add these rule back to ensure we have the default validations for the types.
  const impliedRules: RuleType[] = []

  if (
    'options' in obj &&
    isObject(obj.options) &&
    'list' in obj.options &&
    Array.isArray(obj.options.list)
  ) {
    impliedRules.push({
      type: 'enum',
      values: obj.options.list
        .map((o) => convertUnknown(extractValueFromListOption(o, obj)))
        .filter((v: EncodableValue | undefined) => v !== undefined),
    })
  }

  switch (obj.type) {
    case 'url':
      impliedRules.push({
        type: 'uri',
        allowRelative: false,
      })
      break
    case 'slug':
      impliedRules.push({
        type: 'custom',
      })
      break
    case 'reference':
      impliedRules.push({
        type: 'reference',
      })
      break
    case 'email':
      impliedRules.push({
        type: 'email',
      })
      break
    default:
    // Do nothing
  }

  // Shortcut
  if (!('validation' in obj) || !obj.validation) {
    if (impliedRules.length > 0) {
      return [
        {
          level: 'error',
          rules: impliedRules,
        },
      ]
    }
    return undefined
  }

  const validations: Validation[] = []
  const rules = Array.isArray(obj.validation) ? obj.validation : [obj.validation]
  for (const rule of rules) {
    const validation = maybeValidation(rule)
    if (validation === undefined) {
      continue
    }

    // Add implied rules that aren't already defined in the validation
    const rulesToAdd = impliedRules.filter((ir) => !validation.rules.some((r) => isEqual(r, ir)))
    if (rulesToAdd.length > 0) {
      validation.rules.unshift(...rulesToAdd)
    }

    // If the validation is already present, skip adding it
    if (validations.some((v) => isEqual(v, validation))) {
      continue
    }

    validations.push(validation)
  }

  return validations.length > 0 ? validations : undefined
}

function hasValueField(typeDef: unknown): boolean {
  if (!typeDef || typeof typeDef !== 'object') return false
  if (!('fields' in typeDef)) {
    if ('type' in typeDef && typeDef.type) return hasValueField(typeDef.type)
    return false
  }
  if (!Array.isArray(typeDef.fields)) return false
  return typeDef.fields.some((field) => field.name === 'value')
}

// This logic is pulled from extractValueFromListOption in packages/sanity/src/core/validation/util/normalizeValidationRules.ts.
// It has been slightly tweaked to be safer in accessing the value attribute of the option variable
function extractValueFromListOption(option: unknown, typeDef: Record<string, unknown>): unknown {
  // If you define a `list` option with object items, where the item has a `value` field,
  // we don't want to treat that as the value but rather the surrounding object
  // This differs from the case where you have a title/value pair setup for a string/number, for instance
  if (typeDef.jsonType === 'object' && hasValueField(typeDef)) return option

  if (isObject(option) && 'value' in option && option.value) {
    return option.value
  }

  return option
}

function maybeValidation(val: unknown): Validation | undefined {
  // Handle undefined, false
  if (!val) {
    return undefined
  }

  // Handle function rules - these are functions that return a Rule
  if (isIRuleFunction(val)) {
    try {
      const result = val(new Rule())

      // If the result is a Rule object, attempt to convert it
      if (isIRule(result)) {
        // Recursively convert the returned Rule object
        return maybeValidation(result)
      }

      throw new Error('failed to convert to plain rule')
    } catch (error) {
      // If the function could not convert into a plain rule, mark it as custom
      return {
        level: 'error',
        rules: [{type: 'custom', name: 'function'}],
      }
    }
  }

  // Handle Rule object
  if (isIRule(val)) {
    // Determine validation level
    const level: Validation['level'] = val._level || 'error'

    // Convert message
    const message = maybeValidationMessage(val._message)

    // Convert RuleSpec array to Rule array
    const rules: RuleType[] = []

    for (const spec of val._rules || []) {
      // For custom rule spec, the optional property is determined by the rule.
      // This is used to determine the behaviour the rule when the value is undefined or null
      const optional = val._required === 'optional' || undefined
      const convertedRule = convertRuleSpec(spec, optional)
      if (convertedRule === undefined) {
        continue
      }

      // If the converted spec is a duplicate, skip adding it
      if (rules.some((r) => isEqual(r, convertedRule))) {
        continue
      }

      rules.push(convertedRule)
    }

    if (rules.length === 0) {
      return undefined
    }

    return {
      level,
      rules,
      ...(message && {message}),
    }
  }

  return undefined
}

function isIRule(val: unknown): val is IRule {
  return isObject(val) && '_rules' in val
}

function maybeValidationMessage(val: unknown): ValidationMessage | undefined {
  if (typeof val === 'string') return val
  if (!isObject(val) || Array.isArray(val)) return undefined

  const objectMessage: ObjectMessage = {}
  for (const [field, value] of Object.entries(val)) {
    if (typeof field !== 'string' || typeof value !== 'string') {
      continue
    }
    objectMessage[field] = value
  }

  return Object.keys(objectMessage).length > 0 ? objectMessage : undefined
}

function isIRuleFunction(val: unknown): val is (rule: IRule) => IRule | undefined {
  return typeof val === 'function'
}

// eslint-disable-next-line complexity
function convertRuleSpec(spec: unknown, optional?: true | undefined): RuleType | undefined {
  if (!isObject(spec) || !('flag' in spec)) {
    return undefined
  }

  const constraint = 'constraint' in spec ? spec.constraint : undefined

  switch (spec.flag) {
    case 'integer':
      return {type: 'integer'}
    case 'email':
      return {type: 'email'}
    case 'unique':
      return {type: 'uniqueItems'}
    case 'reference':
      return {type: 'reference'}
    case 'assetRequired':
      return {type: 'assetRequired'}
    case 'stringCasing':
      if (constraint === 'uppercase') return {type: 'uppercase'}
      if (constraint === 'lowercase') return {type: 'lowercase'}
      return undefined
    case 'all':
      if (Array.isArray(constraint)) {
        const children = constraint
          .map((childRule) => maybeValidation(childRule))
          .filter((c) => c !== undefined)
        if (children.length > 0) {
          return {type: 'allOf', children}
        }
      }
      return undefined
    case 'either':
      if (Array.isArray(constraint)) {
        const children = constraint
          .map((childRule) => maybeValidation(childRule))
          .filter((c) => c !== undefined)
        if (children.length > 0) {
          return {type: 'anyOf', children}
        }
      }
      return undefined
    case 'valid':
      if (Array.isArray(constraint)) {
        return {
          type: 'enum',
          values: constraint.map((c) => convertUnknown(c)).filter((v) => v !== undefined),
        }
      }
      return undefined
    case 'min':
      return {type: 'minimum', value: convertConstraintValue(constraint)}
    case 'max':
      return {type: 'maximum', value: convertConstraintValue(constraint)}
    case 'length':
      return {type: 'length', value: convertConstraintValue(constraint)}
    case 'precision':
      return {type: 'precision', value: convertConstraintValue(constraint)}
    case 'lessThan':
      return {type: 'exclusiveMaximum', value: convertConstraintValue(constraint)}
    case 'greaterThan':
      return {type: 'exclusiveMinimum', value: convertConstraintValue(constraint)}
    case 'regex':
      if (isObject(constraint) && 'pattern' in constraint) {
        const {pattern} = constraint
        const invert = 'invert' in constraint ? maybeBoolean(constraint.invert) : undefined

        if (pattern instanceof RegExp) {
          return {
            type: 'regex',
            pattern: pattern.source,
            ...(invert && {invert: true}),
          }
        }
      }
      return undefined
    case 'uri': {
      const allowRelative =
        isObject(constraint) &&
        'options' in constraint &&
        isObject(constraint.options) &&
        'allowRelative' in constraint.options
          ? maybeBoolean(constraint.options.allowRelative)
          : undefined

      return {
        type: 'uri',
        ...(allowRelative !== undefined && {allowRelative}),
      }
    }
    case 'custom':
      return {type: 'custom', ...(optional && {optional})}
    case 'media':
      return {type: 'custom', name: 'media'}
    case 'type':
      return undefined
    case 'presence':
      if (constraint === 'required') return {type: 'required'}
      if (constraint === 'optional') return undefined
      return undefined
    default:
      return undefined
  }
}

function convertConstraintValue(constraint: unknown): string | FieldReference {
  if (
    isObject(constraint) &&
    'type' in constraint &&
    'path' in constraint &&
    constraint.type &&
    constraint.path
  ) {
    // This is a FieldReference
    return {
      type: 'fieldReference',
      path: Array.isArray(constraint.path) ? constraint.path : [constraint.path],
    }
  }
  // Convert to string
  return String(constraint)
}

function maybeBoolean(val: unknown): boolean | undefined {
  if (typeof val === 'boolean') {
    return val
  }
  return undefined
}

function maybeI18n(val: unknown): ObjectI18n | undefined {
  if (!isObject(val) || Array.isArray(val)) return undefined

  // Convert I18nTextRecord to LocalizedMessage format
  const localizedMessage: ObjectI18n = {}
  for (const entry of Object.entries(val)) {
    if (isI18nEntry(entry)) {
      const [field, value] = entry
      localizedMessage[field] = {
        ns: value.ns,
        key: value.key,
      }
    }
  }

  return Object.keys(localizedMessage).length > 0 ? localizedMessage : undefined
}

function isI18nEntry(entry: [unknown, unknown]): entry is [string, ObjectI18nValue] {
  const [key, value] = entry
  return (
    typeof key === 'string' &&
    !!value &&
    typeof value === 'object' &&
    'key' in value &&
    'ns' in value &&
    typeof value.key === 'string' &&
    typeof value.ns === 'string'
  )
}

function maybeOrdering(val: unknown): ObjectOrdering | undefined {
  if (!isObject(val) || Array.isArray(val)) return undefined

  const name = 'name' in val && typeof val.name === 'string' ? val.name : undefined
  // A valid ordering _must_ have a name
  if (name === undefined) return undefined

  // If no title is specified, default to the name
  const title = 'title' in val && typeof val.title === 'string' ? val.title : name
  const by = 'by' in val && Array.isArray(val.by) ? val.by : []

  const orderingBy: ObjectOrderingBy[] = []
  for (const item of by) {
    const orderingItem = maybeOrderingBy(item)
    if (orderingItem) {
      orderingBy.push(orderingItem)
    }
  }

  // A valid ordering _must_ have items (by)
  if (orderingBy.length === 0) return undefined

  const i18n = 'i18n' in val ? maybeI18n(val.i18n) : undefined

  return {
    name,
    title,
    by: orderingBy,
    ...(i18n && {i18n}),
  }
}

function maybeOrderingBy(val: unknown): ObjectOrderingBy | undefined {
  if (!isObject(val) || Array.isArray(val)) return undefined

  const field = 'field' in val && typeof val.field === 'string' ? val.field : undefined
  const direction =
    'direction' in val && (val.direction === 'asc' || val.direction === 'desc')
      ? val.direction
      : undefined

  if (!field || !direction) return undefined

  return {field, direction}
}

/**
 * Checks if `a` is smaller than `b` for determining a canonical name.
 */
function isLessCanonicalName(a: string, b: string): boolean {
  return a.length < b.length || (a.length === b.length && a < b)
}
