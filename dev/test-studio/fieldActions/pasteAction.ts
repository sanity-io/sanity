import {ClipboardIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {defineDocumentFieldAction, useCopyPasteAction} from 'sanity'

import {defineActionItem} from './define'

export const pasteAction = defineDocumentFieldAction({
  name: 'test/paste',
  useAction({path}) {
    const {onPaste} = useCopyPasteAction()
    const onAction = useCallback(() => {
      onPaste(path)
    }, [path, onPaste])

    return defineActionItem({
      type: 'action',
      icon: ClipboardIcon,
      onAction,
      title: 'Paste',
      hidden: path.length === 0,
    })
  },
})
