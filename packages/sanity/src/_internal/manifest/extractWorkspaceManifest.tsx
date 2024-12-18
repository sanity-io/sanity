import DOMPurify from 'isomorphic-dompurify'
import startCase from 'lodash/startCase'
import {renderToString} from 'react-dom/server'
import {
  type ArraySchemaType,
  type BlockDefinition,
  type BooleanSchemaType,
  ConcreteRuleClass,
  createSchema,
  type CrossDatasetReferenceSchemaType,
  type FileSchemaType,
  type MultiFieldSet,
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
import {ServerStyleSheet} from 'styled-components'

import {SchemaIcon, type SchemaIconProps} from './Icon'
import {
  getCustomFields,
  isCrossDatasetReference,
  isCustomized,
  isDefined,
  isPrimitive,
  isRecord,
  isReference,
  isString,
  isType,
} from './manifestTypeHelpers'
import {
  type CreateWorkspaceManifest,
  type ManifestField,
  type ManifestFieldset,
  type ManifestSchemaType,
  type ManifestSerializable,
  type ManifestTitledValue,
  type ManifestTool,
  type ManifestValidationGroup,
  type ManifestValidationRule,
} from './manifestTypes'
import {config} from './purifyConfig'

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
  | 'group' // we strip this from fields

type Validation = {validation: ManifestValidationGroup[]} | Record<string, never>
type ObjectFields = {fields: ManifestField[]} | Record<string, never>
type SerializableProp = ManifestSerializable | ManifestSerializable[] | undefined
type ManifestValidationFlag = ManifestValidationRule['flag']
type ValidationRuleTransformer = (rule: RuleSpec) => ManifestValidationRule | undefined

const MAX_CUSTOM_PROPERTY_DEPTH = 5
const INLINE_TYPES = ['document', 'object', 'image', 'file']

export function extractCreateWorkspaceManifest(workspace: Workspace): CreateWorkspaceManifest {
  const serializedSchema = extractManifestSchemaTypes(workspace.schema)
  const serializedTools = extractManifestTools(workspace.tools)

  return {
    name: workspace.name,
    title: workspace.title,
    subtitle: workspace.subtitle,
    basePath: workspace.basePath,
    projectId: workspace.projectId,
    dataset: workspace.dataset,
    icon: resolveIcon({
      icon: workspace.icon,
      title: workspace.title,
      subtitle: workspace.subtitle,
    }),
    schema: serializedSchema,
    tools: serializedTools,
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

function transformCommonTypeFields(
  type: SchemaType & {fieldset?: string},
  typeName: string,
  context: Context,
): Omit<ManifestSchemaType, 'name' | 'title' | 'type'> {
  const arrayProps =
    typeName === 'array' && type.jsonType === 'array' ? transformArrayMember(type, context) : {}

  const referenceProps = isReference(type) ? transformReference(type) : {}
  const crossDatasetRefProps = isCrossDatasetReference(type)
    ? transformCrossDatasetReference(type)
    : {}

  const objectFields: ObjectFields =
    type.jsonType === 'object' && type.type && INLINE_TYPES.includes(typeName) && isCustomized(type)
      ? {
          fields: getCustomFields(type).map((objectField) => transformField(objectField, context)),
        }
      : {}

  return {
    ...retainCustomTypeProps(type),
    ...transformValidation(type.validation),
    ...ensureString('description', type.description),
    ...objectFields,
    ...arrayProps,
    ...referenceProps,
    ...crossDatasetRefProps,
    ...ensureConditional('readOnly', type.readOnly),
    ...ensureConditional('hidden', type.hidden),
    ...transformFieldsets(type),
    // fieldset prop gets instrumented via getCustomFields
    ...ensureString('fieldset', type.fieldset),
    ...transformBlockType(type, context),
  }
}

function transformFieldsets(
  type: SchemaType,
): {fieldsets: ManifestFieldset[]} | Record<string, never> {
  if (type.jsonType !== 'object') {
    return {}
  }
  const fieldsets = type.fieldsets
    ?.filter((fs): fs is MultiFieldSet => !fs.single)
    .map((fs) => {
      const options = isRecord(fs.options) ? {options: retainSerializableProps(fs.options)} : {}
      return {
        name: fs.name,
        ...ensureCustomTitle(fs.name, fs.title),
        ...ensureString('description', fs.description),
        ...ensureConditional('readOnly', fs.readOnly),
        ...ensureConditional('hidden', fs.hidden),
        ...options,
      }
    })

  return fieldsets?.length ? {fieldsets} : {}
}

function transformType(type: SchemaType, context: Context): ManifestSchemaType {
  const typeName = type.type ? type.type.name : type.jsonType

  return {
    ...transformCommonTypeFields(type, typeName, context),
    name: type.name,
    type: typeName,
    ...ensureCustomTitle(type.name, type.title),
  }
}

function retainCustomTypeProps(type: SchemaType): Record<string, SerializableProp> {
  const manuallySerializedFields: SchemaTypeKey[] = [
    //explicitly added
    'name',
    'title',
    'description',
    'readOnly',
    'hidden',
    'validation',
    'fieldsets',
    'fields',
    'to',
    'of',
    // not serialized
    'type',
    'jsonType',
    '__experimental_actions',
    '__experimental_formPreviewTitle',
    '__experimental_omnisearch_visibility',
    '__experimental_search',
    'components',
    'icon',
    'orderings',
    'preview',
    'groups',
    //only exists on fields
    'group',
    // we know about these, but let them be generically handled
    // deprecated
    // rows (from text)
    // initialValue
    // options
    // crossDatasetReference props
  ]
  const typeWithoutManuallyHandledFields = Object.fromEntries(
    Object.entries(type).filter(
      ([key]) => !manuallySerializedFields.includes(key as unknown as SchemaTypeKey),
    ),
  )
  return retainSerializableProps(typeWithoutManuallyHandledFields) as Record<
    string,
    SerializableProp
  >
}

function retainSerializableProps(maybeSerializable: unknown, depth = 0): SerializableProp {
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
      .map((item) => retainSerializableProps(item, depth + 1))
      .filter((item): item is ManifestSerializable => isDefined(item))
    return arrayItems.length ? arrayItems : undefined
  }

  if (isRecord(maybeSerializable)) {
    const serializableEntries = Object.entries(maybeSerializable)
      .map(([key, value]) => {
        return [key, retainSerializableProps(value, depth + 1)]
      })
      .filter(([, value]) => isDefined(value))
    return serializableEntries.length ? Object.fromEntries(serializableEntries) : undefined
  }

  return undefined
}

function transformField(field: ObjectField & {fieldset?: string}, context: Context): ManifestField {
  const fieldType = field.type
  const typeNameExists = !!context.schema.get(fieldType.name)
  const typeName = typeNameExists ? fieldType.name : (fieldType.type?.name ?? fieldType.name)
  return {
    ...transformCommonTypeFields(fieldType, typeName, context),
    name: field.name,
    type: typeName,
    ...ensureCustomTitle(field.name, fieldType.title),
    // this prop gets added synthetically via getCustomFields
    ...ensureString('fieldset', field.fieldset),
  }
}

function transformArrayMember(
  arrayMember: ArraySchemaType,
  context: Context,
): Pick<ManifestField, 'of'> {
  return {
    of: arrayMember.of.map((type) => {
      const typeNameExists = !!context.schema.get(type.name)
      const typeName = typeNameExists ? type.name : (type.type?.name ?? type.name)
      return {
        ...transformCommonTypeFields(type, typeName, context),
        type: typeName,
        ...(typeName === type.name ? {} : {name: type.name}),
        ...ensureCustomTitle(type.name, type.title),
      }
    }),
  }
}

function transformReference(reference: ReferenceSchemaType): Pick<ManifestSchemaType, 'to'> {
  return {
    to: (reference.to ?? []).map((type) => {
      return {
        ...retainCustomTypeProps(type),
        type: type.name,
      }
    }),
  }
}

function transformCrossDatasetReference(
  reference: CrossDatasetReferenceSchemaType,
): Pick<ManifestSchemaType, 'to' | 'preview'> {
  return {
    to: (reference.to ?? []).map((crossDataset) => {
      const preview = crossDataset.preview?.select
        ? {preview: {select: crossDataset.preview.select}}
        : {}
      return {
        type: crossDataset.type,
        ...ensureCustomTitle(crossDataset.type, crossDataset.title),
        ...preview,
      }
    }),
  }
}

const transformTypeValidationRule: ValidationRuleTransformer = (rule) => {
  return {
    ...rule,
    constraint:
      'constraint' in rule &&
      (typeof rule.constraint === 'string'
        ? rule.constraint.toLowerCase()
        : retainSerializableProps(rule.constraint)),
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
            ((spec) => retainSerializableProps(spec) as ManifestValidationRule)

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

function ensureCustomTitle(typeName: string, value: unknown) {
  const titleObject = ensureString('title', value)

  const defaultTitle = startCase(typeName)
  // omit title if its the same as default, to reduce payload
  if (titleObject.title === defaultTitle) {
    return {}
  }
  return titleObject
}

function ensureString<Key extends string>(key: Key, value: unknown) {
  if (typeof value === 'string') {
    return {
      [key]: value,
    }
  }

  return {}
}

function ensureConditional<const Key extends string>(key: Key, value: unknown) {
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

function resolveEnabledStyles(blockType: ObjectSchemaType): ManifestTitledValue[] | undefined {
  const styleField = blockType.fields?.find((btField) => btField.name === 'style')
  return resolveTitleValueArray(styleField?.type?.options?.list)
}

function resolveEnabledDecorators(spanType: ObjectSchemaType): ManifestTitledValue[] | undefined {
  return 'decorators' in spanType ? resolveTitleValueArray(spanType.decorators) : undefined
}

function resolveEnabledListItems(blockType: ObjectSchemaType): ManifestTitledValue[] | undefined {
  const listField = blockType.fields?.find((btField) => btField.name === 'listItem')
  return resolveTitleValueArray(listField?.type?.options?.list)
}

function resolveTitleValueArray(possibleArray: unknown): ManifestTitledValue[] | undefined {
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
      } satisfies ManifestTitledValue
    })
  if (!titledValues?.length) {
    return undefined
  }

  return titledValues
}

const extractManifestTools = (tools: Workspace['tools']): ManifestTool[] =>
  tools.map((tool) => {
    const {
      title,
      name,
      icon,
      __internalApplicationType: type,
    } = tool as Workspace['tools'][number] & {__internalApplicationType: string}
    return {
      title,
      name,
      type: type || null,
      icon: resolveIcon({
        icon,
        title,
      }),
    } satisfies ManifestTool
  })

const resolveIcon = (props: SchemaIconProps): string | null => {
  const sheet = new ServerStyleSheet()

  try {
    /**
     * You must render the element first so
     * the style-sheet above can be populated
     */
    const element = renderToString(sheet.collectStyles(<SchemaIcon {...props} />))
    const styleTags = sheet.getStyleTags()

    /**
     * We can then create a single string
     * of HTML combining our styles and element
     * before purifying below.
     */
    const html = `${styleTags}${element}`.trim()

    return DOMPurify.sanitize(html, config)
  } catch (error) {
    return null
  } finally {
    sheet.seal()
  }
}
