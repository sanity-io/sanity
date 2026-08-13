import {type ClientPerspective} from '@sanity/client'
import {type ResolvedSchemaTypeMap, type UnresolvedPath} from '@sanity/presentation-comlink'
import {memo, useEffect} from 'react'
import {
  getPublishedId,
  isReleasePerspective,
  RELEASES_STUDIO_CLIENT_OPTIONS,
  useClient,
  useWorkspace,
  VARIANTS_STUDIO_CLIENT_OPTIONS,
} from 'sanity'

import {API_VERSION} from '../../constants'
import {type VisualEditingConnection} from '../../types'
import {extractSchema} from './extract'

export interface PostMessageSchemaProps {
  comlink: VisualEditingConnection
  perspective: ClientPerspective
  variant: string | undefined
}

function getDocumentPathArray(paths: UnresolvedPath[]) {
  const documentPathMap = paths.reduce(
    (acc, {id, path}) => {
      if (acc[id]) {
        acc[id].add(path)
      } else {
        acc[id] = new Set<string>([path])
      }
      return acc
    },
    {} as Record<string, Set<string>>,
  )

  return Object.entries(documentPathMap)
}

/**
 * Experimental approach for sending a representation of the workspace schema
 * over postMessage so it can be used to enrich the Visual Editing experience
 */
function PostMessageSchema(props: PostMessageSchemaProps): React.JSX.Element | null {
  const {comlink, perspective, variant} = props

  const workspace = useWorkspace()

  // Send a representation of the schema to the visual editing context
  useEffect(() => {
    try {
      const schema = extractSchema(workspace)
      /**
       * @deprecated switch to explict schema fetching (using
       * 'visual-editing/schema') at next major
       */
      comlink.post('presentation/schema', {schema})

      return comlink.on('visual-editing/schema', () => ({schema}))
    } catch {
      return undefined
    }
  }, [comlink, workspace])

  const client = useClient(
    // Fetching with a variant requires the `vX` API version for now
    variant
      ? VARIANTS_STUDIO_CLIENT_OPTIONS
      : isReleasePerspective(perspective)
        ? RELEASES_STUDIO_CLIENT_OPTIONS
        : {apiVersion: API_VERSION},
  )

  // Resolve union types from an array of unresolved paths
  useEffect(() => {
    return comlink.on('visual-editing/schema-union-types', async (data) => {
      const documentPathArray = getDocumentPathArray(data.paths)
      const unionTypes = await Promise.all(
        documentPathArray.map(async ([id, paths]) => {
          const arr = Array.from(paths)
          const projection = arr.map((path, i) => `"${i}": ${path}[0]._type`).join(',')
          const query = `*[_id == $id][0]{${projection}}`
          // Should implement max 25 concurrent queries here
          const result = await client.fetch<Record<number, string | null> | null>(
            query,
            {id: getPublishedId(id)},
            {
              tag: 'presentation-schema',
              perspective,
              variant,
            },
          )
          // `client.fetch` returns `null` when no document matches the active perspective,
          // and individual projection entries are `null` when the document exists but the
          // path doesn't resolve. Drop those entries so we only emit fully resolved types.
          const mapped = arr
            .map((path, i) =>
              typeof result?.[i] === 'string' ? {path: path, type: result[i]} : null,
            )
            .filter((item) => item !== null)
          return {id, paths: mapped}
        }),
      )

      const newState: ResolvedSchemaTypeMap = new Map()
      unionTypes.forEach((action) => {
        newState.set(action.id, new Map(action.paths.map(({path, type}) => [path, type])))
      })
      return {types: newState}
    })
  }, [comlink, client, perspective, variant])

  return null
}

export default memo(PostMessageSchema)
