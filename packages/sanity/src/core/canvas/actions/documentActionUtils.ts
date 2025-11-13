import {type DocumentActionProps} from '../../config/document/actions'
import {getDraftId, getPublishedId} from '../../util/draftUtils'

export function getDocumentIdFromDocumentActionProps(
  actionProps: Omit<DocumentActionProps, 'onComplete'>,
): string {
  if (actionProps.liveEditSchemaType) {
    return getPublishedId(actionProps.id)
  }

  if (actionProps.version) {
    return actionProps.version._id
  }

  if (actionProps.draft) {
    return actionProps.draft._id
  }

  return getDraftId(actionProps.id)
}
