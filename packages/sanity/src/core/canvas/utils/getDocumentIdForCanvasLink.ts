import {type DocumentActionProps} from '../../config/document/actions'
import {getDraftId, getPublishedId} from '../../util/draftUtils'

/**
 * @internal
 */
export function getDocumentIdForCanvasLink(
  actionProps: Omit<DocumentActionProps, 'onComplete'>,
): string {
  if (actionProps.version) {
    return actionProps.version._id
  }

  if (actionProps.liveEditSchemaType) {
    return getPublishedId(actionProps.id)
  }

  if (actionProps.draft) {
    return actionProps.draft._id
  }

  return getDraftId(actionProps.id)
}
