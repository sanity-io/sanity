import {CopyIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {
  type DocumentActionComponent,
  InsufficientPermissionsMessage,
  useCopyPasteAction,
  useCurrentUser,
  useDocumentPairPermissions,
} from 'sanity'

/** @internal */
export const CopyDocumentAction: DocumentActionComponent = ({id, type, onComplete}) => {
  const {onCopy} = useCopyPasteAction({
    documentId: id,
    documentType: type,
    path: [],
    schemaType: type,
  })
  const handle = useCallback(() => {
    onCopy()
    onComplete()
  }, [onCopy, onComplete])
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'update',
  })
  const currentUser = useCurrentUser()

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      icon: CopyIcon,
      disabled: true,
      label: 'Copy',
      title: (
        <InsufficientPermissionsMessage context="duplicate-document" currentUser={currentUser} />
      ),
    }
  }

  return {
    icon: CopyIcon,
    disabled: isPermissionsLoading,
    label: 'Copy',
    title: '',
    onHandle: handle,
  }
}
