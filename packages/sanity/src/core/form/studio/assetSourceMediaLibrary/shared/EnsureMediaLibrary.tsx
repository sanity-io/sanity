import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Card} from '@sanity/ui'
import {useEffect} from 'react'
import {Text, VStack, Flex, Icon} from 'ui5'

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
          <Icon
            size={1}
            muted
            icon={ErrorOutlineIcon}
            tone="caution"
            style={{margin: '-0.375rem'}}
          />
          <Text size={1} weight="semibold" as="div" trim={true} tone="caution">
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
          <Icon
            size={1}
            muted
            icon={ErrorOutlineIcon}
            tone="critical"
            style={{margin: '-0.375rem'}}
          />
          <VStack gap={4} data-testid={errorCodeTestId}>
            <Text size={1} weight="semibold" as="div" trim={true} tone="critical">
              {error.message ||
                t('asset-sources.media-library.error.library-could-not-be-resolved')}
            </Text>
          </VStack>
        </Flex>
      </Card>
    )
  }

  return null
}
