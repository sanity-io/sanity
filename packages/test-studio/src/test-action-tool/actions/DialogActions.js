import React from 'react'

export function ModalDialogAction({onComplete}) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  return {
    label: 'Show modal',
    shortcut: 'ctrl+alt+m',
    onHandle: () => {
      setDialogOpen(true)
    },
    dialog: dialogOpen && {
      type: 'modal',
      onClose: onComplete,
      title: 'Demo modal',
      content: <div>Hello modal</div>,
    },
  }
}

export function PopoverDialogAction({onComplete}) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  return {
    label: 'Show popover',
    onHandle: () => {
      setDialogOpen(true)
    },
    dialog: dialogOpen && {
      type: 'popover',
      onClose: onComplete,
      content: 'Hello popover!',
    },
  }
}

export function ConfirmDialogAction({onComplete}) {
  const [dialogOpen, setDialogOpen] = React.useState(false)
  return {
    label: 'Show confirm',
    onHandle: () => {
      setDialogOpen(true)
    },
    dialog: dialogOpen && {
      type: 'confirm',
      onCancel: onComplete,
      onConfirm: () => {
        alert('You confirmed!')
        onComplete()
      },
      message: 'Please confirm!',
    },
  }
}
