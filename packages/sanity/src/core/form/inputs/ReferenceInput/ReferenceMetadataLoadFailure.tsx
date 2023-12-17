import {Stack, Text} from '@sanity/ui'
import React from 'react'
import {Button} from '../../../ui-components'
import {useTranslation} from '../../../i18n'
import {AlertStrip} from '../../components/AlertStrip'

/**
 * Alert strip that shows error encountered while fetching reference metadata, and allowing user
 * to retry the operation.
 *
 * @internal
 */
export function ReferenceMetadataLoadErrorAlertStrip({
  errorMessage,
  onHandleRetry,
}: {
  errorMessage: string
  onHandleRetry: () => void
}) {
  const {t} = useTranslation()
  return (
    <AlertStrip
      padding={1}
      title={t('inputs.reference.metadata-error.title')}
      status="warning"
      data-testid="alert-reference-info-failed"
    >
      <Stack space={3}>
        <Text as="p" muted size={1}>
          {errorMessage}
        </Text>
        <Button
          mode="ghost"
          onClick={onHandleRetry}
          size="large"
          text={t('inputs.reference.metadata-error.retry-button-label')}
          tone="primary"
        />
      </Stack>
    </AlertStrip>
  )
}
