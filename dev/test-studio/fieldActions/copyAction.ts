import {CopyIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {defineDocumentFieldAction, type Path, useCopyPasteAction} from 'sanity'

import {defineActionItem} from './define'

export interface CopyActionResult {
  documentId: string
  documentType: string
  schemaTypeName: string
  docValue: unknown
  isDocument: boolean
  isArray: boolean
  isObject: boolean
  path: Path
}

export const copyAction = defineDocumentFieldAction({
  name: 'test/copy',
  useAction({documentId, documentType, path, schemaType}) {
    const {onCopy} = useCopyPasteAction({documentId, documentType, path, schemaType})
    const onAction = useCallback(() => {
      onCopy()
    }, [onCopy])

    return defineActionItem({
      type: 'action',
      icon: CopyIcon,
      onAction,
      title: 'Copy',
      hidden: path.length === 0,
    })
  },
})
