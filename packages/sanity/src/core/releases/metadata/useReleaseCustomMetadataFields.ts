import {RELEASE_METADATA_CORE_FIELDS, RELEASE_METADATA_TYPE_NAME} from '@sanity/schema/_internal'
import {
  type FieldDefinition,
  isObjectSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Schema,
} from '@sanity/types'
import {useMemo} from 'react'

import {useSchema} from '../../hooks/useSchema'
import {useWorkspace} from '../../studio/workspace'
import {
  acceptCompiledReleaseMetadataFields,
  compileReleaseMetadataSchema,
  createReleaseMetadataFormType,
} from './compileReleaseMetadataType'

const NO_METADATA_FIELDS: readonly ObjectField[] = []
const NO_CONFIGURED_FIELDS: readonly FieldDefinition[] = []

const CORE_FIELD_NAMES = new Set(RELEASE_METADATA_CORE_FIELDS.map((field) => field.name))

const resolvedFormTypes = new WeakMap<
  Schema,
  WeakMap<readonly FieldDefinition[], ObjectSchemaType | null>
>()

function resolveFormType(
  schema: Schema,
  configuredFields: readonly FieldDefinition[],
): ObjectSchemaType | null {
  const metadataType = schema.get(RELEASE_METADATA_TYPE_NAME)
  if (isObjectSchemaType(metadataType)) {
    const customFields = metadataType.fields.filter((field) => !CORE_FIELD_NAMES.has(field.name))
    if (customFields.length > 0) {
      const accepted = acceptCompiledReleaseMetadataFields(customFields)
      return accepted.length > 0
        ? createReleaseMetadataFormType(metadataType, accepted, schema)
        : null
    }
  }
  if (configuredFields.length === 0) return null
  const compiled = compileReleaseMetadataSchema(configuredFields, schema)
  if (!compiled) return null
  return createReleaseMetadataFormType(compiled.schemaType, compiled.schemaType.fields, schema)
}

/**
 * Every dialog reads the fields, so they are resolved once per schema and config.
 * Compiling the configured fields also warns about the ones it drops.
 */
function getFormType(
  schema: Schema,
  configuredFields: readonly FieldDefinition[],
): ObjectSchemaType | null {
  let bySchema = resolvedFormTypes.get(schema)
  if (!bySchema) {
    bySchema = new WeakMap()
    resolvedFormTypes.set(schema, bySchema)
  }
  let formType = bySchema.get(configuredFields)
  if (formType === undefined) {
    formType = resolveFormType(schema, configuredFields)
    bySchema.set(configuredFields, formType)
  }
  return formType
}

/**
 * @internal
 */
export interface ReleaseCustomMetadataFields {
  enabled: boolean
  fields: readonly ObjectField[]
  /** The object type the metadata form edits. Set whenever `enabled` is true. */
  schemaType: ObjectSchemaType | null
}

/**
 * Custom metadata fields edited on releases: the fields the schema adds to
 * `sanity.releaseMetadata`, or else `releases.metadata.fields` from the workspace config.
 * Fields whose type the release dialog cannot edit are left out.
 *
 * Fields are edited only while `beta.variants` is on, since that flag is what
 * turns release editing into the dialog. `fields` is empty whenever `enabled` is false.
 *
 * @internal
 */
export function useReleaseCustomMetadataFields(): ReleaseCustomMetadataFields {
  const {beta, releases} = useWorkspace()
  const schema = useSchema()
  const configuredFields = releases?.metadata?.fields ?? NO_CONFIGURED_FIELDS
  const variantsEnabled = Boolean(beta?.variants?.enabled)

  return useMemo(() => {
    const schemaType = variantsEnabled ? getFormType(schema, configuredFields) : null
    return {
      enabled: schemaType !== null,
      fields: schemaType?.fields ?? NO_METADATA_FIELDS,
      schemaType,
    }
  }, [configuredFields, schema, variantsEnabled])
}
