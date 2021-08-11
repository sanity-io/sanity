import {DocumentActionComponent} from '@sanity/base'
import {useDocumentOperation} from '@sanity/react-hooks'
import {useCallback} from 'react'

export const WriteTitleAction: DocumentActionComponent = (docInfo) => {
  const {patch, commit}: any = useDocumentOperation(docInfo.id, docInfo.type)

  const handle = useCallback(() => {
    patch.execute([{set: {title: 'foo'}}])
    commit.execute()
  }, [commit, patch])

  if (docInfo.liveEdit) {
    return null
  }

  return {
    label: 'Set title to foo!',
    onHandle: handle,
  }
}
