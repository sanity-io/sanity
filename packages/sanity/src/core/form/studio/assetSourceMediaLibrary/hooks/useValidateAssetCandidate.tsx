import {
  type AssetFromSource,
  type FileSchemaType,
  type ImageSchemaType,
  type SanityDocument,
  type ValidationMarker,
} from '@sanity/types'
import {validateItem} from '@sanity/validation/_internal'
import {useCallback} from 'react'

import {useClient} from '../../../../hooks/useClient'
import {useSchema} from '../../../../hooks/useSchema'
import {useWorkspace} from '../../../../studio/workspace'
import {useFormValue} from '../../../contexts/FormValue'
import {filterMediaValidationMarkers} from '../shared/validation'
import {useMediaLibraryIds} from './useMediaLibraryIds'
import {useSanityMediaLibraryConfig} from './useSanityMediaLibraryConfig'

/**
 * The Media Library implementation of the federated view contract's
 * `validateCandidate`: each candidate asset becomes a global document
 * reference on a synthetic `media` field, validated against the hosting
 * field's schema `media` rules — the same synthetic-document validation the
 * iframe `SelectAssetsDialog` performs. Only `media` validation markers are
 * returned; the view gates its confirm control on `level: 'error'` markers.
 *
 * Candidates identify their Media Library asset through
 * `mediaLibraryProps.assetId`; items without it are skipped (nothing to
 * validate against).
 *
 * Must be called inside `MediaLibraryProvider` for the library id.
 *
 * @internal
 */
export function useValidateAssetCandidate({
  schemaType,
}: {
  schemaType?: ImageSchemaType | FileSchemaType
}): (selection: AssetFromSource[]) => Promise<ValidationMarker[]> {
  const mediaLibraryIds = useMediaLibraryIds()
  const mediaLibraryConfig = useSanityMediaLibraryConfig()
  const client = useClient({apiVersion: mediaLibraryConfig.__internal.apiVersion})
  const workspace = useWorkspace()
  const schema = useSchema()
  const document = useFormValue([])

  return useCallback(
    async (selection: AssetFromSource[]) => {
      const results = await Promise.all(
        selection.map(async (item) => {
          const assetId = item.mediaLibraryProps?.assetId
          if (!assetId) return []
          const value = {
            _type: 'mainImage',
            media: {
              _ref: `media-library:${mediaLibraryIds?.libraryId}:${assetId}`,
              _type: 'globalDocumentReference',
              _weak: true,
            },
          }
          const getClient = () => client
          const markers = await validateItem({
            value,
            getClient,
            path: [],
            schema,
            type: schemaType,
            parent: document,
            i18n: workspace.i18n,
            environment: 'studio',
            document: document as SanityDocument,
            getDocumentExists: async () => {
              return true
            },
          })
          return filterMediaValidationMarkers(markers)
        }),
      )
      return results.flat()
    },
    [client, document, mediaLibraryIds?.libraryId, schema, schemaType, workspace.i18n],
  )
}
