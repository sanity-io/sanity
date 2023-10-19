import {
  Dialog,
  Grid,
  Button,
  Stack,
  Text,
  ThemeColorProvider,
  useBoundaryElement,
  PortalProvider,
  DialogProvider,
} from '@sanity/ui'
import React, {useCallback} from 'react'

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

  const portal = useBoundaryElement()

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
      <PortalProvider __unstable_elements={{boundary: portal.element}}>
        <DialogProvider zOffset={Z_OFFSET}>
          <Dialog
            portal="boundary"
            header="Discard comment?"
            id="discard-comment-dialog"
            onClose={onClose}
            width={0}
            onClickOutside={onClose}
            footer={
              <Grid columns={2} padding={2} gap={2}>
                <Button text="Cancel" mode="ghost" onClick={handleCancelClick} />
                <Button onClick={handleConfirmClick} text="Discard" tone="critical" />
              </Grid>
            }
          >
            <Stack padding={4}>
              <Text>Do you want to discard the comment?</Text>
            </Stack>
          </Dialog>
        </DialogProvider>
      </PortalProvider>
    </ThemeColorProvider>
  )
}
