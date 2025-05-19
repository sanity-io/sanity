import {ArraySchemaType, ReferenceSchemaType, SchemaType} from '@sanity/types'
import {
  ArrayTypeDef,
  CommonTypeDef,
  CoreTypeDef,
  ReferenceTypeDef,
  SubtypeDef,
  TypeDef,
} from './types'
import {OWN_PROPS_NAME} from '../legacy/types/constants'

function convertCommonTypeDef(schemaType: SchemaType): CommonTypeDef {
  // Note that OWN_PROPS_NAME is only set on subtypes, not the core types.
  // We might consider setting OWN_PROPS_NAME on _all_ types to avoid this branch.
  const ownProps = schemaType.type ? (schemaType as any)[OWN_PROPS_NAME] : schemaType

  return {
    title: maybeString(ownProps.title),
    description: maybeString(ownProps.description),
    readOnly: maybeBool(ownProps.readOnly),
    hidden: maybeBool(ownProps.hidden),
  }
}

export function convertTypeDef(schemaType: SchemaType): TypeDef {
  const common = convertCommonTypeDef(schemaType)

  if (!schemaType.type) {
    return {
      subtypeOf: null,
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
        subtypeOf: 'array',
        of: (schemaType as ArraySchemaType).of.map((ofType) => ({
          name: ofType.name,
          typeDef: convertTypeDef(ofType),
        })),
        ...common,
      } satisfies ArrayTypeDef
    }
    case 'reference':
    case 'globalDocumentReference':
    case 'crossDatasetReference':
      return {
        subtypeOf: schemaType.type.name,
        to: (schemaType as ReferenceSchemaType).to
          .map((toType) => toType.name || toType.type?.name)
          .filter<string>((name) => typeof name === 'string'),
        ...common,
      } satisfies ReferenceTypeDef
    default:
      return {subtypeOf: schemaType.type.name, ...common} satisfies SubtypeDef
  }
}

function maybeString(val: unknown): string | undefined {
  return typeof val === 'string' ? val : undefined
}

function maybeBool(val: unknown): boolean | undefined {
  return typeof val === 'boolean' ? val : undefined
}
