import {BugIcon} from '@sanity/icons'
import {useId, useState} from 'react'
import {type DocumentActionComponent, type DocumentActionDescription} from 'sanity'

export const useDebugAction: DocumentActionComponent = ({onComplete}) => {
  // If the id changes it means that react unmounted and mounted a new instance of the component, it should stay the same.
  // `onComplete` is considered harmful as it explicitly triggers remounts by updating a `key` prop in the render loop of `<HookCollectionState />``
  const [dialogOpen, setDialogOpen] = useState(false)
  const id = useId()
  return {
    icon: BugIcon,
    label: `Debug onComplete (id: ${id})`,
    title: 'Reset hook collection state',
    onHandle: () => {
      console.count(`DebugAction.onHandle(id: ${id})`)
      setDialogOpen(true)
    },
    shortcut: 'Ctrl+R',
    tone: 'neutral',
    dialog:
      dialogOpen &&
      ({
        type: 'confirm',
        message: 'Call onComplete() to reset the hook collection state?',
        onConfirm: onComplete,
        confirmButtonText: 'Yes',
        onCancel: () => setDialogOpen(false),
        cancelButtonText: 'No',
      } satisfies DocumentActionDescription['dialog']),
  } satisfies DocumentActionDescription
}

useDebugAction.displayName = 'DebugAction'
