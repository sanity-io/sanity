import {
  isObjectSchemaType,
  type ObjectField,
  type ObjectSchemaType,
  type Schema,
} from '@sanity/types'
import {useMemo} from 'react'

import {useSchema} from '../../hooks/useSchema'
import {useWorkspace} from '../../studio/workspace'
import {
  RELEASE_METADATA_TYPE_NAME,
  RESERVED_RELEASE_METADATA_NAMES,
} from '../schema/releaseMetadata'
import {
  acceptCompiledReleaseMetadataFields,
  createReleaseMetadataFormType,
} from './compileReleaseMetadataType'

const NO_METADATA_FIELDS: readonly ObjectField[] = []

const formTypes = new WeakMap<Schema, ObjectSchemaType | null>()

function resolveFormType(schema: Schema): ObjectSchemaType | null {
  const metadataType = schema.get(RELEASE_METADATA_TYPE_NAME)
  if (!isObjectSchemaType(metadataType)) return null
  const customFields = metadataType.fields.filter(
    (field) => !RESERVED_RELEASE_METADATA_NAMES.has(field.name),
  )
  if (customFields.length === 0) return null
  const accepted = acceptCompiledReleaseMetadataFields(customFields)
  return accepted.length > 0 ? createReleaseMetadataFormType(metadataType, accepted, schema) : null
}

/**
 * Every dialog reads the fields, so they are resolved once per schema. Resolving also warns
 * about the fields it drops.
 */
function getFormType(schema: Schema): ObjectSchemaType | null {
  let formType = formTypes.get(schema)
  if (formType === undefined) {
    formType = resolveFormType(schema)
    formTypes.set(schema, formType)
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
 * Custom metadata fields edited on releases: the fields `releases.metadata` adds to the
 * `sanity.releaseMetadata` schema type. Fields whose type the release dialog cannot edit are left
 * out.
 *
 * Fields are edited only while `beta.variants` is on, since that flag is what turns release
 * editing into the dialog. `fields` is empty whenever `enabled` is false.
 *
 * @internal
 */
export function useReleaseCustomMetadataFields(): ReleaseCustomMetadataFields {
  const {beta} = useWorkspace()
  const schema = useSchema()
  const variantsEnabled = Boolean(beta?.variants?.enabled)

  return useMemo(() => {
    const schemaType = variantsEnabled ? getFormType(schema) : null
    return {
      enabled: schemaType !== null,
      fields: schemaType?.fields ?? NO_METADATA_FIELDS,
      schemaType,
    }
  }, [schema, variantsEnabled])
}
