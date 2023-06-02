import {CommentIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {defineDocumentFieldAction} from 'sanity'
import {defineActionItem} from './define'

export const commentAction = defineDocumentFieldAction({
  name: 'test/comment',
  useAction({documentId, documentType, path}) {
    const onAction = useCallback(() => {
      // eslint-disable-next-line no-console
      console.log('comment', {documentId, documentType, path})
    }, [documentId, documentType, path])

    return defineActionItem({
      type: 'action',
      icon: CommentIcon,
      onAction,
      title: 'Comment',
      renderAsButton: true,
    })
  },
})
