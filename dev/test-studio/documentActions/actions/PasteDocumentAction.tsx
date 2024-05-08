import {ClipboardIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {filter, firstValueFrom} from 'rxjs'
import {
  type DocumentActionComponent,
  InsufficientPermissionsMessage,
  useCurrentUser,
  useDocumentOperation,
  useDocumentPairPermissions,
  useDocumentStore,
  PatchEvent,
  set,
} from 'sanity'

/** @internal */
export const PasteDocumentAction: DocumentActionComponent = ({id, type, onComplete}) => {
  const documentStore = useDocumentStore()
  const {patch} = useDocumentOperation(id, type)
  const [isPasting, setPasting] = useState(false)
  const toast = useToast()
  const [permissions, isPermissionsLoading] = useDocumentPairPermissions({
    id,
    type,
    permission: 'update',
  })

  const currentUser = useCurrentUser()

  const handle = useCallback(async () => {
    setPasting(true)

    // // set up the listener before executing
    const pasteSuccess = firstValueFrom(
      documentStore.pair
        .operationEvents(id, type)
        .pipe(filter((e) => e.op === 'patch' && e.type === 'success')),
    )

    const value = localStorage.getItem('copiedDocument')
    if (!value) {
      return
    }
    const parsed = JSON.parse(value) as any
    const newValue = parsed.docValue

    toast.push({
      status: 'success',
      title: 'Field updated',
    })

    delete newValue?.['_id']
    delete newValue?.['_type']
    delete newValue?.['_createdAt']
    delete newValue?.['_updatedAt']
    delete newValue?.['_rev']

    patch.execute([PatchEvent.from(set(newValue, []))])

    await pasteSuccess

    toast.push({
      status: 'success',
      title: 'Document updated',
    })

    onComplete()
  }, [onComplete, type])

  if (!isPermissionsLoading && !permissions?.granted) {
    return {
      icon: ClipboardIcon,
      disabled: true,
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

// CopyDocumentAction.action = 'duplicate'
