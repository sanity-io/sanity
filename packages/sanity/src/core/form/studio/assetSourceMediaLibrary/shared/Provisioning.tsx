import {ErrorOutlineIcon} from '@sanity/icons'
import {Card, Flex, Spinner, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'

import {ErrorBoundary} from '../../../../../ui-components/errorBoundary'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {ProvisionError, useProvision} from '../hooks/useProvision'

const Provision = function Provision(props: {
  projectId: string
  onSetMediaLibraryId: (id: string) => void
}) {
  const {t} = useTranslation()
  const {status} = useProvision(
    props.projectId,
    (err) => {
      throw err
    },
    (libraryId) => {
      props.onSetMediaLibraryId(libraryId)
    },
  )
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

export const Provisioning = function Provisioning(props: {
  projectId: string
  onSetMediaLibraryId: (id: string) => void
}) {
  const [provisionError, setProvisionError] = useState<{
    error: Error
    info: React.ErrorInfo
  } | null>(null)

  const {t} = useTranslation()

  const handleProvisionError = useCallback(
    ({error, info}: {error: Error; info: React.ErrorInfo}) => {
      console.error(error, info)
      setProvisionError({error, info})
    },
    [],
  )

  if (provisionError) {
    let errorCodeTestId = 'ERROR_UNKNOWN'
    if (provisionError.error instanceof ProvisionError) {
      errorCodeTestId = provisionError.error.code
    }
    return (
      <Card padding={4} radius={4} tone="critical" data-testid="media-library-provision-error">
        <Flex gap={3}>
          <Text size={1}>
            <ErrorOutlineIcon />
          </Text>
          <Stack space={4} data-testid={errorCodeTestId}>
            <Text size={1} weight="semibold">
              {provisionError.error.message ||
                t('asset-sources.media-library.error.library-not-found')}
            </Text>
          </Stack>
        </Flex>
      </Card>
    )
  }
  return (
    <>
      <ErrorBoundary onCatch={handleProvisionError}>
        <Provision projectId={props.projectId} onSetMediaLibraryId={props.onSetMediaLibraryId} />
      </ErrorBoundary>
    </>
  )
}
