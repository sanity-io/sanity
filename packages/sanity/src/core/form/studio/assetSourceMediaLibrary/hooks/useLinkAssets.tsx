import {
  type AssetFromSource,
  type FileSchemaType,
  type ImageMetadataType,
  type ImageSchemaType,
  isImageSchemaType,
  type SanityDocument,
} from '@sanity/types'
import {useCallback} from 'react'

import {useClient} from '../../../../hooks'
import {DEFAULT_API_VERSION} from '../constants'
import {type AssetSelectionItem} from '../types'
import {useMediaLibraryId} from './useMediaLibraryId'

export function useLinkAssets({schemaType}: {schemaType?: ImageSchemaType | FileSchemaType}) {
  const libraryId = useMediaLibraryId()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})

  const handleLinkAssets = useCallback(
    async (assetSelection: AssetSelectionItem[]) => {
      if (!libraryId) {
        throw new Error('No libraryId found')
      }

      // Metadata as configured in the schema
      const metadataPropsFromSchema: ImageMetadataType[] | undefined =
        schemaType && isImageSchemaType(schemaType) ? schemaType.options?.metadata : undefined

      const assetsFromSource: AssetFromSource[] = []

      for (const asset of assetSelection) {
        // Link asset from media library to current dataset
        try {
          const result = await client.request({
            method: 'POST',
            url: `/assets/media-library-link/${client.config().dataset}?${metadataPropsFromSchema?.map((prop) => `meta[]=${prop}`).join('&') || ''}`,
            withCredentials: true,
            body: {
              mediaLibraryId: libraryId,
              assetInstanceId: asset.assetInstanceId,
              assetId: asset.asset._id,
            },
            tag: 'media-library.link-asset',
          })
          const assetDocument: SanityDocument = result.document
          assetsFromSource.push({
            kind: 'assetDocumentId',
            value: assetDocument._id,
            mediaLibraryProps: {
              mediaLibraryId: libraryId,
              assetId: asset.asset._id,
              assetInstanceId: asset.assetInstanceId,
            },
          })
        } catch (error) {
          console.error(error)
          throw error
        }
      }
      return assetsFromSource
    },
    [client, libraryId, schemaType],
  )
  return {onLinkAssets: handleLinkAssets}
}
