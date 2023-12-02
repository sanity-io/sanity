import {DialogProvider, Stack, Text, ThemeColorProvider} from '@sanity/ui'
import React, {useCallback} from 'react'
import {Dialog} from '../../../../../../ui'

const Z_OFFSET = 9999999 // Change to appropriate z-offset

/**
 * @beta
 * @hidden
 */
export interface CommentInputDiscardDialogProps {
  onClose: () => void
  onConfirm: () => void
}

/**
 * @beta
 * @hidden
 */
export function CommentInputDiscardDialog(props: CommentInputDiscardDialogProps) {
  const {onClose, onConfirm} = props

  const handleCancelClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onClose()
    },
    [onClose],
  )

  const handleConfirmClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      onConfirm()
    },
    [onConfirm],
  )

  // The ThemeColorProvider is needed to make sure that the backdrop of the dialog not
  // inherits the tone of parent color providers.
  // The PortalProvider and DialogProvider is needed to make sure that the dialog is
  // rendered fullscreen and not scoped to the form view.
  return (
    <ThemeColorProvider tone="default">
      <DialogProvider zOffset={Z_OFFSET}>
        <Dialog
          header="Discard comment?"
          id="discard-comment-dialog"
          onClose={onClose}
          width={0}
          onClickOutside={onClose}
          footer={{
            cancelButton: {
              onClick: handleCancelClick,
            },
            confirmButton: {
              onClick: handleConfirmClick,
              text: 'Discard',
              tone: 'critical',
            },
          }}
        >
          <Stack padding={4}>
            <Text>Do you want to discard the comment?</Text>
          </Stack>
        </Dialog>
      </DialogProvider>
    </ThemeColorProvider>
  )
}
