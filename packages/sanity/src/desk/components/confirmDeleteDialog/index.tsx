import React, {useCallback, useState, useId} from 'react'
import {Text, ErrorBoundary} from '@sanity/ui'
import {Dialog} from '../../../ui'
import {ConfirmDeleteDialog, ConfirmDeleteDialogProps} from './ConfirmDeleteDialog'

export type {ConfirmDeleteDialogProps}

type ArgType<T> = T extends (arg: infer U) => unknown ? U : never
type ErrorInfo = ArgType<React.ComponentProps<typeof ErrorBoundary>['onCatch']>

/** @internal */
function ConfirmDeleteDialogContainer(props: ConfirmDeleteDialogProps) {
  const id = useId()
  const [error, setError] = useState<ErrorInfo | null>(null)
  const handleRetry = useCallback(() => setError(null), [])

  return error ? (
    <Dialog
      id={`dialog-error-${id}`}
      data-testid="confirm-delete-error-dialog"
      header="Error"
      footer={{
        confirmButton: {
          text: 'Retry',
          onClick: handleRetry,
          tone: 'default',
        },
      }}
      onClose={props.onCancel}
    >
      <Text size={1}>An error occurred while loading referencing documents.</Text>
    </Dialog>
  ) : (
    <ErrorBoundary onCatch={setError}>
      <ConfirmDeleteDialog {...props} />
    </ErrorBoundary>
  )
}

export {ConfirmDeleteDialogContainer as ConfirmDeleteDialog}
