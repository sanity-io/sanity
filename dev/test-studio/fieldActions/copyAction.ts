import {CopyIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {
  defineDocumentFieldAction,
  type FormDocumentValue,
  type Path,
  useCopyPasteAction,
  useGetFormValue,
} from 'sanity'

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
  useAction({path}) {
    const getFormValue = useGetFormValue()
    const {onCopy} = useCopyPasteAction()
    const onAction = useCallback(() => {
      const value = getFormValue([]) as FormDocumentValue
      onCopy(path, value)
    }, [path, onCopy, getFormValue])

    return defineActionItem({
      type: 'action',
      icon: CopyIcon,
      onAction,
      title: 'Copy',
      hidden: path.length === 0,
    })
  },
})
