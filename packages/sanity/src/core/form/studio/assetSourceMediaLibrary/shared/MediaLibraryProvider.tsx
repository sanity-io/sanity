import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {MediaLibraryIdContext} from 'sanity/_singletons'

import {ErrorBoundary} from '../../../../../ui-components/errorBoundary'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {EnsureMediaLibrary} from './EnsureMediaLibrary'

// Cache for fetched Media Library ID when 'libraryId' is not specified in the config.
const fetchedLibraryIdCache = new Map<string, string>()

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
  const cachedLibraryId = (projectId && fetchedLibraryIdCache.get(projectId)) || undefined
  const [mediaLibraryId, setMediaLibraryId] = useState<string | null>(
    libraryIdProp || cachedLibraryId || null,
  )

  const [unexpectedError, setUnexpectedError] = useState<Error | null>(null)
  const {t} = useTranslation()

  const handleSetMediaLibraryId = useCallback(
    (libraryId: string) => {
      setMediaLibraryId(libraryId)
      if (projectId) {
        // Write to cache
        fetchedLibraryIdCache.set(projectId, libraryId)
      }
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
          <Stack space={4} data-testid="MEDIA_LIBRARY_ERROR_UNEXPECTED">
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
    <MediaLibraryIdContext.Provider value={mediaLibraryId}>
      <ErrorBoundary onCatch={handleUnexpectedMediaLibraryError}>
        {mediaLibraryId ? (
          children
        ) : (
          <EnsureMediaLibrary projectId={projectId} onSetMediaLibraryId={handleSetMediaLibraryId} />
        )}
      </ErrorBoundary>
    </MediaLibraryIdContext.Provider>
  )
}
