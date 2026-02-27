import {CheckmarkCircleIcon, CloseCircleIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useState} from 'react'
import {type DocumentActionComponent, type DocumentActionDescription} from 'sanity'

export const useTestConfirmDialogAction: DocumentActionComponent = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const {push: pushToast} = useToast()

  const handleOpen = () => {
    if (!dialogOpen) {
      setDialogOpen(true)
      pushToast({closable: true, title: '[confirm] Opened'})
    }
  }

  const handleCancel = () => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[confirm] Cancelled'})
  }

  const handleConfirm = () => {
    setDialogOpen(false)
    pushToast({closable: true, title: '[confirm] Confirmed', status: 'info'})
  }

  return {
    tone: 'positive',
    dialog:
      dialogOpen &&
      ({
        type: 'confirm',
        tone: 'positive',
        message: 'Test confirm dialog',
        onCancel: handleCancel,
        onConfirm: handleConfirm,
        cancelButtonIcon: CloseCircleIcon,
        cancelButtonText: 'No',
        confirmButtonIcon: CheckmarkCircleIcon,
        confirmButtonText: 'Yes',
      } satisfies DocumentActionDescription['dialog']),
    onHandle: handleOpen,
    label: `Test confirm dialog`,
    shortcut: 'mod+p',
  } satisfies DocumentActionDescription
}

useTestConfirmDialogAction.displayName = 'TestConfirmDialogAction'
