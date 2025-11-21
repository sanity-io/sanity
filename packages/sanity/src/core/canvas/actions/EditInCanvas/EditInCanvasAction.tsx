import {ComposeSparklesIcon} from '@sanity/icons'

import {
  type DocumentActionComponent,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {canvasLocaleNamespace} from '../../i18n'
import {useNavigateToCanvasDoc} from '../../useNavigateToCanvasDoc'
import {getDocumentIdForCanvasLink} from '../../utils/getDocumentIdForCanvasLink'
import {useCanvasCompanionDoc} from '../useCanvasCompanionDoc'

// React Compiler needs functions that are hooks to have the `use` prefix, pascal case are treated as a component, these are hooks even though they're confusingly named `DocumentActionComponent`
export const useEditInCanvasAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const {isLinked, companionDoc, loading} = useCanvasCompanionDoc(getDocumentIdForCanvasLink(props))
  const navigateToCanvas = useNavigateToCanvasDoc(companionDoc?.canvasDocumentId, 'action')

  if (!isLinked || loading) return null

  return {
    icon: ComposeSparklesIcon,
    label: t('action.edit-document'),
    onHandle: navigateToCanvas,
  }
}

useEditInCanvasAction.action = 'editInCanvas'
useEditInCanvasAction.displayName = 'EditInCanvasAction'
