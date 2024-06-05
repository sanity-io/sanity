import {ClipboardIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {
  type DocumentActionComponent,
  InsufficientPermissionsMessage,
  useCopyPasteAction,
  useCurrentUser,
  useDocumentPairPermissions,
} from 'sanity'

/** @internal */
export const PasteDocumentAction: DocumentActionComponent = ({id, type, onComplete}) => {
  const {onPaste} = useCopyPasteAction()
  const handle = useCallback(() => {
    onPaste([])
    onComplete()
  }, [onPaste, onComplete])

  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'update',
  })
  const currentUser = useCurrentUser()

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      icon: ClipboardIcon,
      disabled: isPermissionsLoading,
      label: 'Paste',
      title: (
        <InsufficientPermissionsMessage context="duplicate-document" currentUser={currentUser} />
      ),
    }
  }

  return {
    icon: ClipboardIcon,
    disabled: isPermissionsLoading,
    label: 'Paste',
    title: '',
    onHandle: handle,
  }
}
