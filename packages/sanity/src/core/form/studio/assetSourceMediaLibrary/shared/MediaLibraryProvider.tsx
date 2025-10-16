import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {MediaLibraryIdsContext} from 'sanity/_singletons'

import {ErrorBoundary} from '../../../../../ui-components/errorBoundary'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {EnsureMediaLibrary} from './EnsureMediaLibrary'

/** @internal */
export type MediaLibraryIds = {
  libraryId: string
  organizationId: string
}

// Cache for fetched Media Library IDs.
const cachedMediaLibraryIdsMap = new Map<string, MediaLibraryIds>()

/** @internal */
export function MediaLibraryProvider({
  projectId,
  libraryId: libraryIdProp,
  children,
}: {
  projectId: string
  libraryId?: string | null
  children: React.ReactNode
}) {
  const [mediaLibraryIds, setMediaLibraryIds] = useState<MediaLibraryIds | null>(
    () =>
      (projectId && cachedMediaLibraryIdsMap.get(projectId)) ||
      (libraryIdProp && cachedMediaLibraryIdsMap.get(projectId)) ||
      null,
  )

  const [unexpectedError, setUnexpectedError] = useState<Error | null>(null)
  const {t} = useTranslation()

  const handleSetMediaLibraryIds = useCallback(
    (fetchedMediaLibraryIds: MediaLibraryIds) => {
      setMediaLibraryIds(fetchedMediaLibraryIds)
      // Write to cache
      if (projectId) {
        cachedMediaLibraryIdsMap.set(projectId, fetchedMediaLibraryIds)
      }
      cachedMediaLibraryIdsMap.set(fetchedMediaLibraryIds.libraryId, fetchedMediaLibraryIds)
    },
    [projectId],
  )

  const handleUnexpectedMediaLibraryError = useCallback(
    ({error, info}: {error: Error; info: React.ErrorInfo}) => {
      console.error(error, info)
      setUnexpectedError(error)
    },
    [],
  )

  if (unexpectedError) {
    return (
      <Card padding={4} radius={4} tone="critical" data-testid="media-library-provision-error">
        <Flex gap={3}>
          <Text size={1}>
            <ErrorOutlineIcon />
          </Text>
          <Stack gap={4} data-testid="MEDIA_LIBRARY_ERROR_UNEXPECTED">
            <Text size={1} weight="semibold">
              {unexpectedError.message ||
                t('asset-sources.media-library.error.library-could-not-be-resolved')}
            </Text>
          </Stack>
        </Flex>
      </Card>
    )
  }

  return (
    <MediaLibraryIdsContext.Provider value={mediaLibraryIds}>
      <ErrorBoundary onCatch={handleUnexpectedMediaLibraryError}>
        {mediaLibraryIds ? (
          children
        ) : (
          <EnsureMediaLibrary
            mediaLibraryInfo={
              libraryIdProp
                ? {from: 'library', libraryId: libraryIdProp}
                : {from: 'project', projectId}
            }
            onSetMediaLibraryIds={handleSetMediaLibraryIds}
          />
        )}
      </ErrorBoundary>
    </MediaLibraryIdsContext.Provider>
  )
}
