import {ClipboardIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {defineDocumentFieldAction} from '../../../config/document/fieldActions/define'
import {useTranslation} from '../../../i18n'
import {useCopyPaste} from '../../../studio'
import {useGetFormValue} from '../../contexts/GetFormValue'
import {type FormDocumentValue} from '../../types/formDocumentValue'
import {defineActionItem} from './define'

export const pasteAction = defineDocumentFieldAction({
  name: 'pasteField',
  useAction({path}) {
    const {t} = useTranslation('copy-paste')
    const getFormValue = useGetFormValue()

    const isDocument = path.length === 0

    const documentTitle = t('copy-paste.field-action-paste-button.document.title')
    const fieldTitle = t('copy-paste.field-action-paste-button.field.title')
    const title = isDocument ? documentTitle : fieldTitle

    const {onPaste} = useCopyPaste()

    const onAction = useCallback(() => {
      const value = getFormValue([]) as FormDocumentValue
      onPaste(path, value, {
        context: {source: isDocument ? 'documentFieldAction' : 'fieldAction'},
      })
    }, [getFormValue, onPaste, path, isDocument])

    return defineActionItem({
      type: 'action',
      icon: ClipboardIcon,
      onAction,
      title,
    })
  },
})
