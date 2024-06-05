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
export const CopyAction: DocumentActionComponent = ({id, type, onComplete, published, draft}) => {
  const {onCopy} = useCopyPasteAction()
  const handle = useCallback(() => {
    const documentValue = draft ||
      published || {
        _id: id,
        _type: type,
      }
    onCopy([], documentValue)
    onComplete()
  }, [id, type, draft, published, onCopy, onComplete])
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
