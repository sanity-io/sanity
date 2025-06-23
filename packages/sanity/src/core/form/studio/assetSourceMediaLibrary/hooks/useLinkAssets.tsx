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

interface AssetResponse {
  documents: SanityDocument[]
  omitted: any[]
}

const isAssetReady = (response: AssetResponse): boolean => {
  const videoAsset = response.documents.find((doc) => doc._type === 'sanity.videoAsset')
  return videoAsset?.state === 'ready'
}

export function useLinkAssets({schemaType}: {schemaType?: ImageSchemaType | FileSchemaType}) {
  const libraryId = useMediaLibraryId()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})
  const mediaLibraryClient = useClient({
    apiVersion: DEFAULT_API_VERSION,
  }).withConfig({
    '~experimental_resource': {
      type: 'media-library',
      id: libraryId ?? '',
    },
  })

  const ensureAssetIsReady = useCallback(
    async (assetId: string, assetInstanceId: string, signal?: AbortSignal) => {
      const MAX_ATTEMPTS = 30 // 5 minutes total with 10 second intervals
      const POLL_INTERVAL = 10000 // 10 seconds

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        try {
          // Check if we've been aborted
          if (signal?.aborted) {
            throw new Error('Asset polling was aborted')
          }

          const result = await mediaLibraryClient.request<AssetResponse>({
            method: 'GET',
            url: `media-libraries/${libraryId}/doc/${assetId},${assetInstanceId}`,
            withCredentials: true,
            signal, // Pass the abort signal to the request
          })

          // Check if the asset is ready
          if (isAssetReady(result)) {
            return result.documents
          }

          // If we haven't reached max attempts, wait before trying again
          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise((resolve, reject) => {
              const timeoutId = setTimeout(resolve, POLL_INTERVAL)
              // Clean up timeout if aborted
              signal?.addEventListener('abort', () => {
                clearTimeout(timeoutId)
                reject(new Error('Asset polling was aborted'))
              })
            })
          }
        } catch (error) {
          // If aborted, throw immediately
          if (signal?.aborted) {
            throw error
          }
          // If we haven't reached max attempts, wait before trying again
          if (attempt < MAX_ATTEMPTS - 1) {
            await new Promise((resolve, reject) => {
              const timeoutId = setTimeout(resolve, POLL_INTERVAL)
              // Clean up timeout if aborted
              signal?.addEventListener('abort', () => {
                clearTimeout(timeoutId)
                reject(new Error('Asset polling was aborted'))
              })
            })
          } else {
            throw error // Throw the error on the last attempt
          }
        }
      }

      throw new Error('Asset failed to become ready after maximum attempts')
    },
    [libraryId, mediaLibraryClient],
  )

  const handleLinkAssets = useCallback(
    async (assetSelection: AssetSelectionItem[], signal?: AbortSignal) => {
      if (!libraryId) {
        throw new Error('No libraryId found')
      }

      // Metadata as configured in the schema
      const metadataPropsFromSchema: ImageMetadataType[] | undefined =
        schemaType && isImageSchemaType(schemaType) ? schemaType.options?.metadata : undefined

      const assetsFromSource: AssetFromSource[] = []

      for (const asset of assetSelection) {
        // Check if we've been aborted
        if (signal?.aborted) {
          throw new Error('Asset linking was aborted')
        }

        if (asset.asset._type === 'sanity.videoAsset') {
          // Ensure video asset is ready before linking
          await ensureAssetIsReady(asset.asset._id, asset.assetInstanceId, signal)
        }

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
            signal,
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
    [client, libraryId, schemaType, ensureAssetIsReady],
  )
  return {onLinkAssets: handleLinkAssets}
}
