import {LinkIcon} from '@sanity/icons'
import {useToast} from '@sanity/ui'
import {useCallback} from 'react'

import {defineDocumentFieldAction} from '../../../config/document/fieldActions/define'
import {useTranslation} from '../../../i18n'
import {pathToString} from '../../../validation/util/pathToString'
import {defineActionItem} from './define'

export const linkToFieldAction = defineDocumentFieldAction({
  name: 'linkToField',
  useAction({path}) {
    const {push: pushToast} = useToast()
    const {t} = useTranslation('studio')

    const isDocument = path.length === 0

    const onAction = useCallback(() => {
      const pathString = pathToString(path)
      const url = new URL(window.location.href)
      url.searchParams.set('path', pathString)

      navigator.clipboard
        .writeText(url.toString())
        .then(() => {
          pushToast({
            status: 'success',
            title: t('field-action.link-to-field.copied-toast.title'),
            closable: true,
          })
        })
        .catch((error: Error) => {
          pushToast({
            status: 'error',
            title: t('field-action.link-to-field.copy-failed-toast.title'),
            description: error.message,
            closable: true,
          })
        })
    }, [path, pushToast, t])

    if (isDocument) {
      return null
    }

    return defineActionItem({
      type: 'action',
      icon: LinkIcon,
      onAction,
      title: t('field-action.link-to-field.title'),
    })
  },
})
