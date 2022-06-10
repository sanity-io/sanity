import React, {useCallback, useState} from 'react'
import {Box, Flex, Button, Dialog, Text, ErrorBoundary} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {ConfirmDeleteDialog, ConfirmDeleteDialogProps} from './ConfirmDeleteDialog'

export type {ConfirmDeleteDialogProps}

type ArgType<T> = T extends (arg: infer U) => unknown ? U : never
type ErrorInfo = ArgType<React.ComponentProps<typeof ErrorBoundary>['onCatch']>

function ConfirmDeleteDialogContainer(props: ConfirmDeleteDialogProps) {
  const id = useId()
  const [error, setError] = useState<ErrorInfo | null>(null)
  const handleRetry = useCallback(() => setError(null), [])

  return error ? (
    <Dialog
      id={`dialog-error-${id}`}
      data-testid="confirm-delete-error-dialog"
      header="Error"
      footer={
        <Flex paddingX={4} paddingY={3} direction="column">
          <Button mode="ghost" text="Retry" onClick={handleRetry} />
        </Flex>
      }
      onClose={props.onCancel}
    >
      <Box padding={4}>
        <Text>An error occurred while loading referencing documents.</Text>
      </Box>
    </Dialog>
  ) : (
    <ErrorBoundary onCatch={setError}>
      <ConfirmDeleteDialog {...props} />
    </ErrorBoundary>
  )
}

export {ConfirmDeleteDialogContainer as ConfirmDeleteDialog}
