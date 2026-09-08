import {
  isDocumentSchemaType,
  isObjectSchemaType,
  isPrimitiveSchemaType,
  type Schema,
} from '@sanity/types'

/** @internal */
export interface SchemaDiagnostics {
  documentTypes: number
  objectTypes: number
  primitiveTypes: number
}

/** @internal */
export function getSchemaDiagnostics(schema: Schema): SchemaDiagnostics {
  const diagnostics: SchemaDiagnostics = {
    documentTypes: 0,
    objectTypes: 0,
    primitiveTypes: 0,
  }

  for (const typeName of schema.getLocalTypeNames()) {
    const schemaType = schema.get(typeName)

    if (isDocumentSchemaType(schemaType)) {
      diagnostics.documentTypes += 1
    } else if (isObjectSchemaType(schemaType)) {
      diagnostics.objectTypes += 1
    } else if (isPrimitiveSchemaType(schemaType)) {
      diagnostics.primitiveTypes += 1
    }
  }

  return diagnostics
}

/** @internal */
export function getUniqueTargetCount(
  workspaces: readonly {dataset: string; projectId: string}[],
): number {
  return new Set(workspaces.map(({dataset, projectId}) => JSON.stringify([projectId, dataset])))
    .size
}
