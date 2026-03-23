import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useEffect} from 'react'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {
  useEnsureMediaLibrary,
  type useEnsureMediaLibraryProps,
} from '../hooks/useEnsureMediaLibrary'
import {type MediaLibraryIds} from './MediaLibraryProvider'

export function EnsureMediaLibrary(props: {
  mediaLibraryInfo: useEnsureMediaLibraryProps
  onSetMediaLibraryIds: (ids: MediaLibraryIds) => void
}) {
  const {onSetMediaLibraryIds} = props
  const {t} = useTranslation()
  const {id, organizationId, status, error} = useEnsureMediaLibrary(props.mediaLibraryInfo)

  useEffect(() => {
    if (status === 'active' && id && organizationId) {
      onSetMediaLibraryIds({libraryId: id, organizationId})
    }
  }, [id, onSetMediaLibraryIds, organizationId, status])

  if (status === 'inactive') {
    return (
      <Card padding={4} radius={4} tone="caution" data-testid="media-library-absent-warning">
        <Flex gap={3}>
          <Text size={1}>
            <ErrorOutlineIcon />
          </Text>
          <Text size={1} weight="semibold">
            {t('asset-sources.media-library.error.no-media-library-provisioned')}
          </Text>
        </Flex>
      </Card>
    )
  }

  if (status === 'error' && error) {
    const errorCodeTestId = error.code
    return (
      <Card padding={4} radius={4} tone="critical" data-testid="media-library-provision-error">
        <Flex gap={3}>
          <Text size={1}>
            <ErrorOutlineIcon />
          </Text>
          <Stack space={4} data-testid={errorCodeTestId}>
            <Text size={1} weight="semibold">
              {error.message ||
                t('asset-sources.media-library.error.library-could-not-be-resolved')}
            </Text>
          </Stack>
        </Flex>
      </Card>
    )
  }

  return null
}
