import {createStructureBuilder, StructureBuilder} from '@sanity/structure'
import {useMemo} from 'react'
import {useSource} from '../source'

export function useStructureBuilder(): StructureBuilder {
  const {
    client,
    initialValueTemplates,
    name: sourceName,
    schema,
    structureDocumentNode,
  } = useSource()

  return useMemo(
    () =>
      createStructureBuilder({
        client,
        initialValueTemplates: initialValueTemplates,
        resolveStructureDocumentNode: structureDocumentNode,
        schema,
        source: sourceName,
      }),
    [client, initialValueTemplates, schema, sourceName, structureDocumentNode]
  )
}
