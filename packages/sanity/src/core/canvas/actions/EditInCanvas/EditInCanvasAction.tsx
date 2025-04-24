import {ComposeSparklesIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {canvasLocaleNamespace} from '../../i18n'
import {useCompanionDoc} from '../useCompanionDoc'

export const EditInCanvasAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const {isLinked, companionDoc, loading} = useCompanionDoc(props.id)

  const navigateToCanvas = useCallback(() => {
    // TODO: get this dynamically
    const organizationId = '@oF5P8QpKU'
    window.open(
      `https://www.sanity.work/${organizationId}/canvas/doc/${companionDoc?.canvasDocumentId}`,
      '_blank',
    )
  }, [companionDoc])

  if (!isLinked || loading) return null

  return {
    icon: ComposeSparklesIcon,
    label: t('action.edit-document'),
    onHandle: navigateToCanvas,
  }
}

EditInCanvasAction.action = 'editInCanvas'
EditInCanvasAction.displayName = 'EditInCanvasAction'
