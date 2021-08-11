import {DocumentActionComponent} from '@sanity/base'
import {useDocumentOperation} from '@sanity/react-hooks'
import {useCallback} from 'react'

export const SaveAction: DocumentActionComponent = ({id, type, onComplete}) => {
  const {commit}: any = useDocumentOperation(id, type)

  const handle = useCallback(async () => {
    await commit.execute()
    onComplete()
  }, [commit, onComplete])

  return {
    disabled: Boolean(commit.disabled),
    label: 'Save',
    onHandle: handle,
  }
}
