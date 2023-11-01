import React, {useCallback, useState, useId} from 'react'
import {Box, Flex, Button, Dialog, Text, ErrorBoundary} from '@sanity/ui'
import {deskLocaleNamespace} from '../../i18n'
import {ConfirmDeleteDialog, ConfirmDeleteDialogProps} from './ConfirmDeleteDialog'
import {useTranslation} from 'sanity'

export type {ConfirmDeleteDialogProps}

type ArgType<T> = T extends (arg: infer U) => unknown ? U : never
type ErrorInfo = ArgType<React.ComponentProps<typeof ErrorBoundary>['onCatch']>

/** @internal */
function ConfirmDeleteDialogContainer(props: ConfirmDeleteDialogProps) {
  const {t} = useTranslation(deskLocaleNamespace)
  const id = useId()
  const [error, setError] = useState<ErrorInfo | null>(null)
  const handleRetry = useCallback(() => setError(null), [])

  return error ? (
    <Dialog
      id={`dialog-error-${id}`}
      data-testid="confirm-delete-error-dialog"
      header={t('confirm-delete-dialog.error.title.text')}
      footer={
        <Flex paddingX={4} paddingY={3} direction="column">
          <Button
            mode="ghost"
            text={t('confirm-delete-dialog.error.retry-button.text')}
            onClick={handleRetry}
          />
        </Flex>
      }
      onClose={props.onCancel}
    >
      <Box padding={4}>
        <Text>{t('confirm-delete-dialog.error.message.text')}</Text>
      </Box>
    </Dialog>
  ) : (
    <ErrorBoundary onCatch={setError}>
      <ConfirmDeleteDialog {...props} />
    </ErrorBoundary>
  )
}

export {ConfirmDeleteDialogContainer as ConfirmDeleteDialog}
