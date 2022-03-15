import {createStructureBuilder, StructureBuilder} from '@sanity/structure'
import {useMemo} from 'react'
import {useClient} from '../client'
import {useSource} from '../source'

export function useStructureBuilder(): StructureBuilder {
  const client = useClient()
  const source = useSource()

  return useMemo(
    () =>
      createStructureBuilder({
        client,
        initialValueTemplates: source.initialValueTemplates,
        resolveStructureDocumentNode: source.structureDocumentNode,
        schema: source.schema,
        source: source.name,
      }),
    [client, source]
  )
}
