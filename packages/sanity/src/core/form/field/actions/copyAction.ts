import {CopyIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {defineDocumentFieldAction} from '../../../config/document/fieldActions/define'
import {useTranslation} from '../../../i18n'
import {useCopyPaste} from '../../../studio'
import {useGetFormValue} from '../../contexts/GetFormValue'
import {type FormDocumentValue} from '../../types/formDocumentValue'
import {defineActionItem} from './define'

export const copyAction = defineDocumentFieldAction({
  name: 'copyField',
  useAction({path}) {
    const getFormValue = useGetFormValue()
    const {onCopy} = useCopyPaste()
    const {t} = useTranslation('copy-paste')

    const isDocument = path.length === 0

    const documentTitle = t('copy-paste.field-action-copy-button.document.title')
    const fieldTitle = t('copy-paste.field-action-copy-button.field.title')
    const title = isDocument ? documentTitle : fieldTitle

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
      title,
    })
  },
})
