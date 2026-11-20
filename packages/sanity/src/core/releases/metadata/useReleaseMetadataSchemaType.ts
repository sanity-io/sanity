import {type ObjectSchemaType, type Schema} from '@sanity/types'
import {useMemo} from 'react'

import {useSchema} from '../../hooks/useSchema'
import {useWorkspace} from '../../studio/workspace'
import {compileReleaseMetadataSchema} from './compileReleaseMetadataType'

export interface CompiledReleaseMetadataSchema {
  schema: Schema
  schemaType: ObjectSchemaType
}

/**
 * Compiles `releases.metadata.fields` into the private object type that hosts them.
 * Returns `null` when no field is configured or none can be edited. Callers decide
 * whether the fields should apply at all.
 */
export function useReleaseMetadataSchemaType(): CompiledReleaseMetadataSchema | null {
  const fields = useWorkspace().releases?.metadata?.fields
  const schema = useSchema()
  return useMemo(
    () => (fields ? compileReleaseMetadataSchema(fields, schema) : null),
    [fields, schema],
  )
}
