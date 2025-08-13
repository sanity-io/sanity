import {type SanityClient} from '@sanity/client'
import {
  type AssetFromSource,
  type FileSchemaType,
  type ImageMetadataType,
  type ImageSchemaType,
  isImageSchemaType,
  type SanityDocument,
} from '@sanity/types'
import {get} from 'lodash'
import {useCallback} from 'react'
import {
  delay,
  firstValueFrom,
  from,
  map,
  mergeMap,
  type OperatorFunction,
  retry,
  timer,
  toArray,
} from 'rxjs'

import {useClient} from '../../../../hooks/useClient'
import {DEFAULT_API_VERSION} from '../constants'
import {type AssetSelectionItem} from '../types'
import {useMediaLibraryIds} from './useMediaLibraryIds'

export function useLinkAssets({schemaType}: {schemaType?: ImageSchemaType | FileSchemaType}) {
  const mediaLibraryIds = useMediaLibraryIds()
  const client = useClient({apiVersion: DEFAULT_API_VERSION})

  const handleLinkAssets = useCallback<
    (assetSelection: AssetSelectionItem[]) => Promise<AssetFromSource[]>
  >(
    (assetSelection) => {
      if (!mediaLibraryIds?.libraryId) {
        throw new Error('No libraryId found')
      }

      // Metadata as configured in the schema
      const metadataPropsFromSchema: ImageMetadataType[] | undefined =
        schemaType && isImageSchemaType(schemaType) ? schemaType.options?.metadata : undefined

      const assetsFromSource = from(assetSelection).pipe(
        linkAsset({
          client,
          mediaLibraryId: mediaLibraryIds.libraryId,
          metadataPropsFromSchema,
        }),
        toArray(),
      )

      return firstValueFrom(assetsFromSource, {
        defaultValue: [],
      })
    },
    [client, mediaLibraryIds?.libraryId, schemaType],
  )
  return {onLinkAssets: handleLinkAssets}
}

interface AssetLinkingContext {
  mediaLibraryId: string
  metadataPropsFromSchema: ImageMetadataType[] | undefined
  client: SanityClient
}

interface AssetLinkingResponse {
  document: SanityDocument
}

function linkAsset({
  client,
  mediaLibraryId,
  metadataPropsFromSchema,
}: AssetLinkingContext): OperatorFunction<AssetSelectionItem, AssetFromSource> {
  const RETRY_DELAY = 2_000
  const RETRY_LIMIT = 10
  const LINKING_DELAY = 1_000
  const LINKING_CONCURRENCY = 5

  return mergeMap((asset) => {
    return client.observable
      .request<AssetLinkingResponse>({
        method: 'POST',
        url: `/assets/media-library-link/${client.config().dataset}?${metadataPropsFromSchema?.map((prop) => `meta[]=${prop}`).join('&') || ''}`,
        withCredentials: true,
        body: {
          mediaLibraryId,
          assetInstanceId: asset.assetInstanceId,
          assetId: asset.asset._id,
        },
        tag: 'media-library.link-asset',
      })
      .pipe(
        retry({
          count: RETRY_LIMIT,
          delay(error) {
            if (isAssetUnreadyError(error)) {
              return timer(RETRY_DELAY)
            }
            throw error
          },
        }),
        map<AssetLinkingResponse, AssetFromSource>(({document}) => ({
          kind: 'assetDocumentId',
          value: document._id,
          mediaLibraryProps: {
            mediaLibraryId,
            assetId: asset.asset._id,
            assetInstanceId: asset.assetInstanceId,
          },
        })),
        delay(LINKING_DELAY),
      )
  }, LINKING_CONCURRENCY)
}

function isAssetUnreadyError(maybeError: unknown): boolean {
  const isUnprocessable = get(maybeError, ['statusCode']) === 422

  const isUnready =
    get(maybeError, ['response', 'body', 'message']) === 'Media library asset is not ready'

  return isUnprocessable && isUnready
}
