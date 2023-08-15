import React, {useCallback, useState, useId, useEffect} from 'react'
import {Box, Flex, Button, Dialog, Text, ErrorBoundary} from '@sanity/ui'
import {ConfirmDeleteDialog, ConfirmDeleteDialogProps} from './ConfirmDeleteDialog'
import {clearAllBodyScrollLocks, disableBodyScroll} from 'sanity'

export type {ConfirmDeleteDialogProps}

type ArgType<T> = T extends (arg: infer U) => unknown ? U : never
type ErrorInfo = ArgType<React.ComponentProps<typeof ErrorBoundary>['onCatch']>

/** @internal */
function ConfirmDeleteDialogContainer(props: ConfirmDeleteDialogProps) {
  const {onCancel} = props
  const id = useId()
  const [error, setError] = useState<ErrorInfo | null>(null)
  const handleRetry = useCallback(() => setError(null), [])
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)

  //Avoid background of dialog being scrollable on mobile
  useEffect(() => {
    if (documentScrollElement) {
      disableBodyScroll(documentScrollElement)
    }
  })

  const onHandleClose = useCallback(() => {
    onCancel()
    clearAllBodyScrollLocks()
  }, [onCancel])

  return error ? (
    <Dialog
      id={`dialog-error-${id}`}
      data-testid="confirm-delete-error-dialog"
      header="Error"
      contentRef={setDocumentScrollElement}
      footer={
        <Flex paddingX={4} paddingY={3} direction="column">
          <Button mode="ghost" text="Retry" onClick={handleRetry} />
        </Flex>
      }
      onClose={onHandleClose}
      onClickOutside={onHandleClose}
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
