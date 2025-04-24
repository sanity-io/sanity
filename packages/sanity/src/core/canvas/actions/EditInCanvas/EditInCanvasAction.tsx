import {ComposeSparklesIcon} from '@sanity/icons'
import {useCallback, useMemo} from 'react'

import {
  type DocumentActionComponent,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useRenderingContext} from '../../../store/renderingContext/useIsInRenderContext'
import {canvasLocaleNamespace} from '../../i18n'
import {useCompanionDoc} from '../useCompanionDoc'

export const EditInCanvasAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const {isLinked, companionDoc, loading} = useCompanionDoc(props.id)
  const renderingContext = useRenderingContext()

  const isInDashboard = renderingContext?.name === 'coreUi'
  const disabled = useMemo(() => {
    if (!isInDashboard) {
      return {disabled: true, reason: t('action.link-document-disabled.not-in-dashboard')}
    }
    return {disabled: false, reason: undefined}
  }, [isInDashboard, t])

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
    disabled: disabled.disabled,
    icon: ComposeSparklesIcon,
    label: t('action.edit-document'),
    title: disabled.reason,
    onHandle: navigateToCanvas,
  }
}

EditInCanvasAction.action = 'editInCanvas'
EditInCanvasAction.displayName = 'EditInCanvasAction'
