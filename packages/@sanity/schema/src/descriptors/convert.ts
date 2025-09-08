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
import {
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
