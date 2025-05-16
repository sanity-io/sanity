import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {ErrorBoundary} from '../../../../../ui-components/errorBoundary'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useProvision} from '../hooks/useProvision'

const Provision = function Provision(props: {
  projectId: string
  onSetMediaLibraryId: (id: string) => void
}) {
  const {onSetMediaLibraryId} = props
  const {t} = useTranslation()
  const {id, status, error} = useProvision(props.projectId)

  useEffect(() => {
    if (status === 'active' && id) {
      onSetMediaLibraryId(id)
    }
  }, [id, onSetMediaLibraryId, status])

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
              {error.message || t('asset-sources.media-library.error.library-not-found')}
            </Text>
          </Stack>
        </Flex>
      </Card>
    )
  }
  if (status === 'provisioning') {
    return (
      <Card padding={4} radius={4} tone="caution">
        <Flex gap={3}>
          <Text size={1}>
            <Spinner />
          </Text>
          <Stack space={4}>
            <Text size={1} weight="semibold" data-testid="media-library-provisioning-message">
              {t('asset-sources.media-library.info.provisioning')}
            </Text>
          </Stack>
        </Flex>
      </Card>
    )
  }
  return null
}

export function EnsureMediaLibrary(props: {
  projectId: string
  onSetMediaLibraryId: (id: string) => void
}) {
  const [unexpectedError, setUnexpectedError] = useState<Error | null>(null)
  const {t} = useTranslation()
  const handleUnexpectedError = useCallback(
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
          <Stack space={4} data-testid="ERROR_UNEXPECTED">
            <Text size={1} weight="semibold">
              {unexpectedError.message || t('asset-sources.media-library.error.library-not-found')}
            </Text>
          </Stack>
        </Flex>
      </Card>
    )
  }

  return (
    <ErrorBoundary onCatch={handleUnexpectedError}>
      <Provision projectId={props.projectId} onSetMediaLibraryId={props.onSetMediaLibraryId} />
    </ErrorBoundary>
  )
}
