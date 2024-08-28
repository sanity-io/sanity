import startCase from 'lodash/startCase'
import {
  type ArraySchemaType,
  type BlockDefinition,
  type BooleanSchemaType,
  ConcreteRuleClass,
  createSchema,
  type FileSchemaType,
  type NumberSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type Rule,
  type RuleSpec,
  type Schema,
  type SchemaType,
  type SchemaValidationValue,
  type SpanSchemaType,
  type StringSchemaType,
  type Workspace,
} from 'sanity'

import {
  getCustomFields,
  isDefined,
  isPrimitive,
  isRecord,
  isString,
  isType,
} from './manifestTypeHelpers'
import {
  type ManifestField,
  type ManifestSchemaType,
  type ManifestSerializable,
  type ManifestValidationGroup,
  type ManifestValidationRule,
  type ManifestWorkspace,
  type TitledValue,
} from './manifestTypes'

interface Context {
  schema: Schema
}

type SchemaTypeKey =
  | keyof ArraySchemaType
  | keyof BooleanSchemaType
  | keyof FileSchemaType
  | keyof NumberSchemaType
  | keyof ObjectSchemaType
  | keyof StringSchemaType
  | keyof ReferenceSchemaType
  | keyof BlockDefinition

type Validation = {validation: ManifestValidationGroup[]} | Record<string, never>
type ObjectFields = {fields: ManifestField[]} | Record<string, never>
type SerializableProp = ManifestSerializable | ManifestSerializable[] | undefined
type ManifestValidationFlag = ManifestValidationRule['flag']
type ValidationRuleTransformer = (rule: RuleSpec) => ManifestValidationRule | undefined

const MAX_CUSTOM_PROPERTY_DEPTH = 5

export function extractWorkspace(workspace: Workspace): ManifestWorkspace {
  const serializedSchema = extractManifestSchemaTypes(workspace.schema)

  return {
    name: workspace.name,
    dataset: workspace.dataset,
    schema: serializedSchema,
  }
}

/**
 * Extracts all serializable properties from userland schema types,
 * so they best-effort can be used as definitions for Schema.compile
. */
export function extractManifestSchemaTypes(schema: Schema): ManifestSchemaType[] {
  const typeNames = schema.getTypeNames()
  const context = {schema}

  const studioDefaultTypeNames = createSchema({name: 'default', types: []}).getTypeNames()

  return typeNames
    .filter((typeName) => !studioDefaultTypeNames.includes(typeName))
    .map((typeName) => schema.get(typeName))
    .filter((type): type is SchemaType => typeof type !== 'undefined')
    .map((type) => transformType(type, context))
}

function transformCommonTypeFields(type: SchemaType, context: Context) {
  const shouldCreateDefinition = !context.schema.get(type.name) || isCustomized(type)

  const arrayProperties = type.jsonType === 'array' ? transformArrayMember(type, context) : {}

  const referenceProperties = isReferenceSchemaType(type) ? transformReference(type) : {}

  const objectFields: ObjectFields =
    type.jsonType === 'object' && type.type && shouldCreateDefinition
      ? {
          fields: getCustomFields(type).map((objectField) => transformField(objectField, context)),
        }
      : {}

  return {
    ...retainUserlandTypeProps(type),
    ...transformValidation(type.validation),
    ...objectFields,
    ...ensureCustomTitle(type.name, type.title),
    ...ensureString('description', type.description),
    ...arrayProperties,
    ...referenceProperties,
    ...ensureConditional('readOnly', type.readOnly),
    ...ensureConditional('hidden', type.hidden),
    ...transformBlockType(type, context),
  }
}

function transformType(type: SchemaType, context: Context): ManifestSchemaType {
  const typeName = type.type ? type.type.name : type.jsonType

  return {
    ...transformCommonTypeFields(type, context),
    name: type.name,
    type: typeName,
  }
}

function retainUserlandTypeProps(type: SchemaType): Record<string, SerializableProp> {
  const manuallySerializedFields: SchemaTypeKey[] = [
    'name',
    'title',
    'description',
    'readOnly',
    'hidden',
    'deprecated',
    'type',
    'jsonType',
    '__experimental_actions',
    '__experimental_formPreviewTitle',
    '__experimental_omnisearch_visibility',
    '__experimental_search',
    'groups',
    'components',
    'icon',
    'orderings',
    'validation',
    'fieldsets',
    'preview',
    'fields',
    'to',
    'of',
    // we know about these, but let them be generically handled
    // deprecated
    // rows
    // initialValue
    // options
    // reference stuff
  ]
  const typeWithoutManuallyHandledFields = Object.fromEntries(
    Object.entries(type).filter(
      ([key]) => !manuallySerializedFields.includes(key as unknown as SchemaTypeKey),
    ),
  )
  return retainSerializableProperties(typeWithoutManuallyHandledFields) as Record<
    string,
    SerializableProp
  >
}

function retainSerializableProperties(maybeSerializable: unknown, depth = 0): SerializableProp {
  if (depth > MAX_CUSTOM_PROPERTY_DEPTH) {
    return undefined
  }

  if (!isDefined(maybeSerializable)) {
    return undefined
  }

  if (isPrimitive(maybeSerializable)) {
    // cull empty strings
    if (maybeSerializable === '') {
      return undefined
    }
    return maybeSerializable
  }

  // url-schemes ect..
  if (maybeSerializable instanceof RegExp) {
    return maybeSerializable.toString()
  }

  if (Array.isArray(maybeSerializable)) {
    const arrayItems = maybeSerializable
      .map((item) => retainSerializableProperties(item, depth + 1))
      .filter((item): item is ManifestSerializable => isDefined(item))
    return arrayItems.length ? arrayItems : undefined
  }

  if (isRecord(maybeSerializable)) {
    const serializableEntries = Object.entries(maybeSerializable)
      .map(([key, value]) => {
        return [key, retainSerializableProperties(value, depth + 1)]
      })
      .filter(([, value]) => isDefined(value))
    return serializableEntries.length ? Object.fromEntries(serializableEntries) : undefined
  }

  return undefined
}

function transformField(field: ObjectField, context: Context): ManifestField {
  return {
    ...transformCommonTypeFields(field.type, context),
    name: field.name,
    type: field.type.name,
  }
}

function transformArrayMember(
  arrayMember: ArraySchemaType,
  context: Context,
): Pick<ManifestField, 'of'> {
  return {
    of: arrayMember.of.map((type) => {
      return {
        ...transformCommonTypeFields(type, context),
        type: type.name,
      }
    }),
  }
}

function transformReference(reference: ReferenceSchemaType): Pick<ManifestSchemaType, 'to'> {
  return {
    to: (reference.to ?? []).map((type) => ({
      ...retainUserlandTypeProps(type),
      type: type.name,
    })),
  }
}

const transformTypeValidationRule: ValidationRuleTransformer = (rule) => {
  return {
    ...rule,
    constraint:
      'constraint' in rule &&
      (typeof rule.constraint === 'string'
        ? rule.constraint.toLowerCase()
        : retainSerializableProperties(rule.constraint)),
  }
}

const validationRuleTransformers: Partial<
  Record<ManifestValidationFlag, ValidationRuleTransformer>
> = {
  type: transformTypeValidationRule,
}

function transformValidation(validation: SchemaValidationValue): Validation {
  const validationArray = (Array.isArray(validation) ? validation : [validation]).filter(
    (value): value is Rule => typeof value === 'object' && '_type' in value,
  )

  // we dont want type in the output as that is implicitly given by the typedef itself an will only bloat the payload
  const disallowedFlags = ['type']

  // Validation rules that refer to other fields use symbols, which cannot be serialized. It would
  // be possible to transform these to a serializable type, but we haven't implemented that for now.
  const disallowedConstraintTypes: (symbol | unknown)[] = [ConcreteRuleClass.FIELD_REF]

  const serializedValidation = validationArray
    .map(({_rules, _message, _level}) => {
      const message: Partial<Pick<ManifestValidationGroup, 'message'>> =
        typeof _message === 'string' ? {message: _message} : {}

      const serializedRules = _rules
        .filter((rule) => {
          if (!('constraint' in rule)) {
            return false
          }

          const {flag, constraint} = rule

          if (disallowedFlags.includes(flag)) {
            return false
          }

          return !(
            typeof constraint === 'object' &&
            'type' in constraint &&
            disallowedConstraintTypes.includes(constraint.type)
          )
        })
        .reduce<ManifestValidationRule[]>((rules, rule) => {
          const transformer: ValidationRuleTransformer =
            validationRuleTransformers[rule.flag] ??
            ((spec) => retainSerializableProperties(spec) as ManifestValidationRule)

          const transformedRule = transformer(rule)
          if (!transformedRule) {
            return rules
          }
          return [...rules, transformedRule]
        }, [])

      return {
        rules: serializedRules,
        level: _level,
        ...message,
      }
    })
    .filter((group) => !!group.rules.length)

  return serializedValidation.length ? {validation: serializedValidation} : {}
}

function ensureCustomTitle<const Value>(typeName: string, value: Value) {
  const titleObject = ensureString('title', value)

  const defaultTitle = startCase(typeName)

  // omit title if its the same as default, to reduce payload
  if (titleObject.title === defaultTitle) {
    return {}
  }
  return titleObject
}

function ensureString<Key extends string, const Value>(key: Key, value: Value) {
  if (typeof value === 'string') {
    return {
      [key]: value,
    }
  }

  return {}
}

function ensureConditional<Key extends string, const Value>(key: Key, value: Value) {
  if (typeof value === 'boolean') {
    return {
      [key]: value,
    }
  }

  if (typeof value === 'function') {
    return {
      [key]: 'conditional',
    }
  }

  return {}
}

function isReferenceSchemaType(type: unknown): type is ReferenceSchemaType {
  return typeof type === 'object' && type !== null && 'name' in type && type.name === 'reference'
}

function isObjectField(maybeOjectField: unknown) {
  return (
    typeof maybeOjectField === 'object' && maybeOjectField !== null && 'name' in maybeOjectField
  )
}

function isCustomized(maybeCustomized: SchemaType) {
  const hasFieldsArray =
    isObjectField(maybeCustomized) &&
    !isType(maybeCustomized, 'reference') &&
    !isType(maybeCustomized, 'crossDatasetReference') &&
    'fields' in maybeCustomized &&
    Array.isArray(maybeCustomized.fields)

  if (!hasFieldsArray) {
    return false
  }

  const fields = getCustomFields(maybeCustomized)
  return !!fields.length
}

export function transformBlockType(
  blockType: SchemaType,
  context: Context,
): Pick<ManifestSchemaType, 'marks' | 'lists' | 'styles' | 'of'> | Record<string, never> {
  if (blockType.jsonType !== 'object' || !isType(blockType, 'block')) {
    return {}
  }

  const childrenField = blockType.fields?.find((field) => field.name === 'children') as
    | {type: ArraySchemaType}
    | undefined

  if (!childrenField) {
    return {}
  }
  const ofType = childrenField.type.of
  if (!ofType) {
    return {}
  }
  const spanType = ofType.find((memberType) => memberType.name === 'span') as
    | ObjectSchemaType
    | undefined
  if (!spanType) {
    return {}
  }
  const inlineObjectTypes = (ofType.filter((memberType) => memberType.name !== 'span') ||
    []) as ObjectSchemaType[]

  return {
    marks: {
      annotations: (spanType as SpanSchemaType).annotations.map((t) => transformType(t, context)),
      decorators: resolveEnabledDecorators(spanType),
    },
    lists: resolveEnabledListItems(blockType),
    styles: resolveEnabledStyles(blockType),
    of: inlineObjectTypes.map((t) => transformType(t, context)),
  }
}

function resolveEnabledStyles(blockType: ObjectSchemaType): TitledValue[] | undefined {
  const styleField = blockType.fields?.find((btField) => btField.name === 'style')
  return resolveTitleValueArray(styleField?.type.options.list)
}

function resolveEnabledDecorators(spanType: ObjectSchemaType): TitledValue[] | undefined {
  return 'decorators' in spanType ? resolveTitleValueArray(spanType.decorators) : undefined
}

function resolveEnabledListItems(blockType: ObjectSchemaType): TitledValue[] | undefined {
  const listField = blockType.fields?.find((btField) => btField.name === 'listItem')
  return resolveTitleValueArray(listField?.type?.options.list)
}

function resolveTitleValueArray(possibleArray: unknown): TitledValue[] | undefined {
  if (!possibleArray || !Array.isArray(possibleArray)) {
    return undefined
  }
  const titledValues = possibleArray
    .filter(
      (d): d is {value: string; title?: string} => isRecord(d) && !!d.value && isString(d.value),
    )
    .map((item) => {
      return {
        value: item.value,
        ...ensureString('title', item.title),
      } satisfies TitledValue
    })
  if (!titledValues?.length) {
    return undefined
  }

  return titledValues
}
