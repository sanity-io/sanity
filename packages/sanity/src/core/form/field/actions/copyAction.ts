import {CopyIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {useCallback} from 'react'

import {defineDocumentFieldAction} from '../../../config/document/fieldActions/define'
import {useCopyPasteAction} from '../../../studio/copyPaste/useCopyPasteAction'
import {useGetFormValue} from '../../contexts/GetFormValue'
import {type FormDocumentValue} from '../../types/formDocumentValue'
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
  name: 'copyField',
  useAction({path}) {
    const isDocument = path.length === 0
    const getFormValue = useGetFormValue()
    const {onCopy} = useCopyPasteAction()
    const onAction = useCallback(() => {
      const value = getFormValue([]) as FormDocumentValue
      onCopy(path, value, {
        context: {source: isDocument ? 'documentFieldAction' : 'fieldAction'},
      })
    }, [path, isDocument, onCopy, getFormValue])

    return defineActionItem({
      type: 'action',
      icon: CopyIcon,
      onAction,
      title: isDocument ? 'Copy document' : 'Copy field',
    })
  },
})
