import {CopyIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {
  type DocumentActionComponent,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentPairPermissions,
} from 'sanity'

/** @internal */
export const CopyDocumentAction: DocumentActionComponent = ({
  id,
  type,
  draft,
  published,
  onComplete,
}) => {
  const toast = useToast()
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'update',
  })

  const currentUser = useCurrentUser()
  const doc = draft || published || {}
  const filteredDoc = useMemo(() => {
    return Object.keys(doc).reduce((filtered, prop) => {
      if (!prop.startsWith('_')) {
        // @ts-ignore
        filtered[prop] = doc[prop]
      }
      return filtered
    }, {})
  }, [draft, published])

  const handle = useCallback(async () => {
    const payload = {type, path: [], docValue: filteredDoc}
    console.log('copying document', payload)

    const value = JSON.stringify(payload)
    localStorage.setItem('copiedDocument', value)

    toast.push({
      status: 'success',
      title: 'Document copied',
    })

    onComplete()
  }, [onComplete, type, filteredDoc])

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
