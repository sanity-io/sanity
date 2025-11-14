import {type DocumentActionProps} from '../config/document/actions'
import {getDraftId, getPublishedId} from './draftUtils'

/**
 * @internal
 */
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
