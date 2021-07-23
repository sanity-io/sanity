import {Box, Button, ButtonTone, Dialog, DialogProps, Popover, useToast} from '@sanity/ui'
import React, {useCallback, useEffect} from 'react'

// @todo: rename these to @sanity/ui button tones when possible (breaking change)
type LegacyButtonColor = 'primary' | 'success' | 'danger' | 'white' | 'warning'

const LEGACY_DIALOG_COLOR: {[key: string]: ButtonTone | undefined} = {
  primary: 'primary',
  success: 'positive',
  danger: 'critical',
  warning: 'caution',
}

// Todo: move these to action spec/core types
interface ConfirmDialogProps {
  type: 'confirm'
  color: LegacyButtonColor
  message: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
}

// Todo: move these to action spec/core types
interface ModalDialogProps {
  type: 'modal'
  content: React.ReactNode
  /**
   * @beta
   */
  header?: DialogProps['header']
  onClose: () => void
  showCloseButton: true
  /**
   * @beta
   */
  width?: DialogProps['width']
}

// Todo: move these to action spec/core types
interface PopoverDialogProps {
  type: 'popover'
  content: React.ReactNode
  onClose: () => void
}

interface LegacyDialogProps {
  type: 'legacy'
  content: React.ReactNode
  onClose: () => void
}

interface ErrorDialogProps {
  type: 'error'
  title: string
  content: React.ReactNode
  onClose: () => void
}

interface SuccessDialogProps {
  type: 'success'
  title: string
  content: React.ReactNode
  onClose: () => void
}

interface Props {
  dialog:
    | ConfirmDialogProps
    | LegacyDialogProps
    | ModalDialogProps
    | PopoverDialogProps
    | ErrorDialogProps
    | SuccessDialogProps
  referenceElement: HTMLElement | null
}

export function ActionStateDialog(props: Props) {
  const {dialog, referenceElement} = props
  const {push: pushToast} = useToast()

  const handleCancel = useCallback(() => {
    if (dialog.type === 'confirm') {
      dialog.onCancel()
    }
  }, [dialog])

  const handleConfirm = useCallback(() => {
    if (dialog.type === 'confirm') {
      dialog.onConfirm()
    }
  }, [dialog])

  useEffect(() => {
    if (dialog.type === 'success') {
      pushToast({
        closable: true,
        status: 'success',
        title: dialog.title,
        description: dialog.content,
        onClose: dialog.onClose,
      })
    }

    if (dialog.type === 'error') {
      pushToast({
        closable: true,
        status: 'error',
        onClose: dialog.onClose,
        title: dialog.title,
        description: dialog.content,
      })
    }
  }, [dialog, pushToast])

  if (dialog.type === 'legacy') {
    return <>{dialog.content}</>
  }

  if (dialog.type === 'confirm') {
    return (
      <Popover
        content={
          <div>
            <div>{dialog.message}</div>
            <div>
              <Button onClick={handleCancel} mode="ghost" text="Cancel" />
              <Button
                onClick={handleConfirm}
                text="Confirm"
                tone={LEGACY_DIALOG_COLOR[dialog.color] || 'critical'}
              />
            </div>
          </div>
        }
        open
        placement="auto-end"
        referenceElement={referenceElement}
      />
    )
    // return (
    //   <PopoverDialog
    //     actions={[
    //       {
    //         key: 'confirm',
    //         color: dialog.color || 'danger',
    //         title: 'Confirm',
    //       },
    //       {
    //         key: 'cancel',
    //         kind: 'simple',
    //         title: 'Cancel',
    //       },
    //     ]}
    //     hasAnimation
    //     onAction={handleDialogAction}
    //     onClickOutside={dialog.onCancel}
    //     onEscape={dialog.onCancel}
    //     placement="auto-end"
    //     referenceElement={referenceElement}
    //     size="small"
    //     useOverlay={false}
    //   >
    //     <div>{dialog.message}</div>
    //   </PopoverDialog>
    // )
  }

  if (dialog.type === 'modal') {
    return (
      <Dialog
        header={dialog.header}
        id="modal"
        onClose={dialog.onClose}
        onClickOutside={dialog.onClose}
        // __unstable_hideCloseButton={!dialog.showCloseButton}
        width={dialog.width}
      >
        <Box padding={4}>{dialog.content}</Box>
      </Dialog>
    )
  }

  if (dialog.type === 'popover') {
    return (
      <Popover content={dialog.content} placement="auto-end" referenceElement={referenceElement} />
      // <PopoverDialog
      //   onClickOutside={dialog.onClose}
      //   onEscape={dialog.onClose}
      //   placement="auto-end"
      //   useOverlay={false}
      //   hasAnimation
      //   referenceElement={referenceElement}
      // >
      //   {dialog.content}
      // </PopoverDialog>
    )
  }

  if (dialog.type === 'success') {
    return null
  }

  if (dialog.type === 'error') {
    return null
  }

  const unknownDialog: any = dialog

  // eslint-disable-next-line no-console
  console.warn(`Unsupported dialog type ${unknownDialog.type}`)

  return (
    <Dialog
      id="dialog"
      onClose={unknownDialog.onClose}
      onClickOutside={unknownDialog.onClose}
      // size="medium"
      // padding="large"
    >
      {unknownDialog.content || (
        <>
          Unexpected dialog type (<code>{unknownDialog.type}</code>)
        </>
      )}
    </Dialog>
  )
}
