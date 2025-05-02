import {ComposeSparklesIcon} from '@sanity/icons'

import {
  type DocumentActionComponent,
  type DocumentActionProps,
} from '../../../config/document/actions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getDraftId, getPublishedId} from '../../../util/draftUtils'
import {canvasLocaleNamespace} from '../../i18n'
import {useNavigateToCanvasDoc} from '../../useNavigateToCanvasDoc'
import {useCanvasCompanionDoc} from '../useCanvasCompanionDoc'

export const EditInCanvasAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const {t} = useTranslation(canvasLocaleNamespace)
  const {isLinked, companionDoc, loading} = useCanvasCompanionDoc(
    props.liveEditSchemaType ? getPublishedId(props.id) : getDraftId(props.id),
  )
  const navigateToCanvas = useNavigateToCanvasDoc(companionDoc?.canvasDocumentId, 'action')

  if (!isLinked || loading) return null

  return {
    icon: ComposeSparklesIcon,
    label: t('action.edit-document'),
    onHandle: navigateToCanvas,
  }
}

EditInCanvasAction.action = 'editInCanvas'
EditInCanvasAction.displayName = 'EditInCanvasAction'
