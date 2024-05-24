import {
  type ManifestV1Field,
  manifestV1Schema,
  type ManifestV1Type,
  type ManifestV1TypeValidationRule,
  type ManifestV1ValidationGroup,
  type ManifestV1ValidationRule,
  type ManifestV1Workspace,
} from '@sanity/manifest'
import {
  type ArraySchemaType,
  ConcreteRuleClass,
  type ObjectField,
  type ReferenceSchemaType,
  type Rule,
  type RuleSpec,
  type SchemaType,
  type SchemaValidationValue,
  type Workspace,
} from 'sanity'

interface Context {
  workspace: Workspace
}

// type WithWarnings<Base> = Base & {
//   warnings: {
//     path: string[]
//     warning: string
//   }[]
// }

type MaybeCustomized<Type> = Type & {
  isCustomized?: boolean
}

type Customized<Type> = Type & {
  isCustomized: true
}

type Validation =
  | {
      validation: ManifestV1ValidationGroup[]
    }
  | Record<string, never>

type ObjectFields =
  | {
      fields: ManifestV1Field[]
    }
  | Record<string, never>

export function extractWorkspace(workspace: Workspace): ManifestV1Workspace {
  const typeNames = workspace.schema.getTypeNames()
  const context = {workspace}

  const schema = typeNames
    .map((typeName) => workspace.schema.get(typeName))
    .filter((type): type is SchemaType => typeof type !== 'undefined')
    .map((type) => transformType(type, context))

  return {
    name: workspace.name,
    dataset: workspace.dataset,
    schema: manifestV1Schema.parse(schema),
  }
}

function transformType(type: SchemaType, context: Context): ManifestV1Type {
  const typeName = type.type ? type.type.name : type.jsonType

  if (type.jsonType === 'object') {
    return {
      name: type.name,
      type: typeName,
      deprecated: type.deprecated,
      fields: (type.fields ?? []).map((field) => transformField(field, context)),
      validation: transformValidation(type.validation),
      ...ensureString('title', type.title),
      ...ensureString('description', type.description),
      ...ensureBoolean('readOnly', type.readOnly),
      ...ensureBoolean('hidden', type.hidden),
    }
  }

  return {
    name: type.name,
    type: typeName,
    deprecated: type.deprecated,
    validation: transformValidation(type.validation),
    ...ensureString('title', type.title),
    ...ensureString('description', type.description),
    ...ensureBoolean('readOnly', type.readOnly),
    ...ensureBoolean('hidden', type.hidden),
  }
}

function transformField(field: MaybeCustomized<ObjectField>, context: Context): ManifestV1Field {
  const shouldCreateDefinition =
    !context.workspace.schema.get(field.type.name) || isCustomized(field)

  const arrayProperties =
    field.type.jsonType === 'array' ? transformArrayMember(field.type, context) : {}

  const referenceProperties = isReferenceSchemaType(field.type)
    ? transformReference(field.type)
    : {}

  const validation: Validation = shouldCreateDefinition
    ? {
        validation: transformValidation(field.type.validation),
      }
    : {}

  const objectFields: ObjectFields =
    field.type.jsonType === 'object' && field.type.type && shouldCreateDefinition
      ? {
          fields: field.type.fields.map((objectField) => transformField(objectField, context)),
        }
      : {}

  return {
    name: field.name,
    type: field.type.name,
    deprecated: field.type.deprecated,
    ...validation,
    ...objectFields,
    ...ensureString('title', field.type.title),
    ...ensureString('description', field.type.description),
    ...arrayProperties,
    ...referenceProperties,
    ...ensureBoolean('readOnly', field.type.readOnly),
    ...ensureBoolean('hidden', field.type.hidden),
  }
}

function transformArrayMember(
  arrayMember: ArraySchemaType,
  context: Context,
): Pick<ManifestV1Field, 'of'> {
  return {
    of: arrayMember.of.map((type) => {
      const shouldCreateDefinition = !context.workspace.schema.get(type.name) || isCustomized(type)

      if (shouldCreateDefinition) {
        return transformType(type, context)
      }

      // TODO: Deduplicate process taken from `transformField`.
      // return transformField(type, context)

      const arrayProperties =
        type.type?.jsonType === 'array' ? transformArrayMember(type.type, context) : {}

      const referenceProperties = isReferenceSchemaType(type.type)
        ? transformReference(type.type)
        : {}

      const validation: Validation = shouldCreateDefinition
        ? {
            validation: transformValidation(type.type?.validation),
          }
        : {}

      const objectFields: ObjectFields =
        type.type?.jsonType === 'object' && type.type.type && shouldCreateDefinition
          ? {
              fields: type.type.fields.map((objectField) => transformField(objectField, context)),
            }
          : {}

      return {
        name: type.name,
        type: type.type?.name,
        deprecated: type.type?.deprecated,
        ...validation,
        ...objectFields,
        ...ensureString('title', type.type?.title),
        ...ensureString('description', type.type?.description),
        ...arrayProperties,
        ...referenceProperties,
        ...ensureBoolean('readOnly', type.type?.readOnly),
        ...ensureBoolean('hidden', type.type?.hidden),
      }
    }),
  }
}

function transformReference(reference: ReferenceSchemaType): Pick<ManifestV1Type, 'to'> {
  return {
    to: (reference.to ?? []).map((type) => ({
      type: type.name,
    })),
  }
}

type ValidationRuleTransformer<
  Flag extends ManifestV1ValidationRule['flag'] = ManifestV1ValidationRule['flag'],
> = (rule: RuleSpec & {flag: Flag}) => ManifestV1ValidationRule & {flag: Flag}

const transformTypeValidationRule: ValidationRuleTransformer<'type'> = (rule) => {
  return {
    ...rule,
    constraint: rule.constraint.toLowerCase() as ManifestV1TypeValidationRule['constraint'], // xxx
  }
}

const validationRuleTransformers: Partial<
  Record<ManifestV1ValidationRule['flag'], ValidationRuleTransformer>
> = {
  type: transformTypeValidationRule,
}

function transformValidation(validation: SchemaValidationValue): ManifestV1ValidationGroup[] {
  const validationArray = (Array.isArray(validation) ? validation : [validation]).filter(
    (value): value is Rule => typeof value === 'object' && '_type' in value,
  )

  // Custom validation rules cannot be serialized.
  const disallowedFlags = ['custom']

  // Validation rules that refer to other fields use symbols, which cannot be serialized. It would
  // be possible to transform these to a serializable type, but we haven't implemented that for now.
  const disallowedConstraintTypes: (symbol | unknown)[] = [ConcreteRuleClass.FIELD_REF]

  return validationArray.map(({_rules, _message, _level}) => {
    // TODO: Handle insances of `LocalizedValidationMessages`.
    const message: Partial<Pick<ManifestV1ValidationGroup, 'message'>> =
      typeof _message === 'string' ? {message: _message} : {}

    return {
      rules: _rules
        .filter((rule) => {
          if (!('constraint' in rule)) {
            return false
          }

          const {flag, constraint} = rule

          if (disallowedFlags.includes(flag)) {
            return false
          }

          if (
            typeof constraint === 'object' &&
            'type' in constraint &&
            disallowedConstraintTypes.includes(constraint.type)
          ) {
            return false
          }

          return true
        })
        .reduce<ManifestV1ValidationRule[]>((rules, rule) => {
          const transformer: ValidationRuleTransformer =
            validationRuleTransformers[rule.flag] ?? ((_) => _)
          return [...rules, transformer(rule)]
        }, []),
      level: _level,
      ...message,
    }
  })
}

function ensureString<
  Key extends string,
  const Value,
  const DefaultValue extends string | undefined,
>(
  key: Key,
  value: Value,
  defaultValue?: DefaultValue,
): Value extends string
  ? Record<Key, Value>
  : [DefaultValue] extends [string]
    ? Record<Key, DefaultValue>
    : Record<Key, never> {
  if (typeof value === 'string') {
    return {
      [key]: value,
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  if (typeof defaultValue === 'string') {
    return {
      [key]: defaultValue,
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return {} as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

function ensureBoolean<
  Key extends string,
  const Value,
  const DefaultValue extends boolean | undefined,
>(
  key: Key,
  value: Value,
  defaultValue?: DefaultValue,
): Value extends boolean
  ? Record<Key, Value>
  : [DefaultValue] extends [boolean]
    ? Record<Key, DefaultValue>
    : Record<Key, never> {
  if (typeof value === 'boolean') {
    return {
      [key]: value,
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  if (typeof defaultValue === 'boolean') {
    return {
      [key]: defaultValue,
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  return {} as any // eslint-disable-line @typescript-eslint/no-explicit-any
}

function isReferenceSchemaType(type: unknown): type is ReferenceSchemaType {
  return typeof type === 'object' && type !== null && 'name' in type && type.name === 'reference'
}

function isObjectField(maybeOjectField: unknown): maybeOjectField is MaybeCustomized<ObjectField> {
  return (
    typeof maybeOjectField === 'object' && maybeOjectField !== null && 'name' in maybeOjectField
  )
}

function isMaybeCustomized<Type>(
  maybeCustomized: unknown,
): maybeCustomized is MaybeCustomized<Type> {
  return isObjectField(maybeCustomized)
}

function isCustomized<Type>(maybeCustomized: Type): maybeCustomized is Customized<Type> {
  return (
    isObjectField(maybeCustomized) &&
    'fields' in maybeCustomized.type &&
    isObjectField(maybeCustomized.type) &&
    maybeCustomized.type.fields.some((field) => isMaybeCustomized(field) && field.isCustomized)
  )
}
