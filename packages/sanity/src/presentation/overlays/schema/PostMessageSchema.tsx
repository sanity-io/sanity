/* eslint-disable max-nested-callbacks */
import {type ClientPerspective} from '@sanity/client'
import {type UnresolvedPath} from '@sanity/presentation-comlink'
import {useRootTheme} from '@sanity/ui'
import {memo, useEffect} from 'react'
import {
  getPublishedId,
  isReleasePerspective,
  RELEASES_STUDIO_CLIENT_OPTIONS,
  useClient,
  useWorkspace,
} from 'sanity'

import {API_VERSION} from '../../constants'
import {type VisualEditingConnection} from '../../types'
import {extractSchema} from './extract'

export interface PostMessageSchemaProps {
  comlink: VisualEditingConnection
  perspective: ClientPerspective
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
  const {comlink, perspective} = props

  const workspace = useWorkspace()
  const theme = useRootTheme()

  // Send a representation of the schema to the visual editing context
  useEffect(() => {
    try {
      const schema = extractSchema(workspace, theme)
      /**
       * @deprecated switch to explict schema fetching (using
       * 'visual-editing/schema') at next major
       */
      comlink.post('presentation/schema', {schema})

      return comlink.on('visual-editing/schema', () => ({schema}))
    } catch {
      return undefined
    }
  }, [comlink, theme, workspace])

  const client = useClient(
    isReleasePerspective(perspective) ? RELEASES_STUDIO_CLIENT_OPTIONS : {apiVersion: API_VERSION},
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
          const result = await client.fetch(
            query,
            {id: getPublishedId(id)},
            {
              tag: 'presentation-schema',
              perspective,
            },
          )
          const mapped = arr.map((path, i) => ({path: path, type: result[i]}))
          return {id, paths: mapped}
        }),
      )

      const newState = new Map()
      unionTypes.forEach((action) => {
        newState.set(action.id, new Map(action.paths.map(({path, type}) => [path, type])))
      })
      return {types: newState}
    })
  }, [comlink, client, perspective])

  return null
}

export default memo(PostMessageSchema)
