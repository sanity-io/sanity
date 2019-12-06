import {PublishAction} from './actions/PublishAction'
import {DiscardChangesAction} from './actions/DiscardChangesAction'
import {UnpublishAction} from './actions/UnpublishAction'
import {DuplicateAction} from './actions/DuplicateAction'
import {DeleteAction} from './actions/DeleteAction'

export {PublishAction}
export {DiscardChangesAction}
export {UnpublishAction}
export {DuplicateAction}
export {DeleteAction}

export default function defaultResolveDocumentActions(props) {
  return [PublishAction, DiscardChangesAction, UnpublishAction, DuplicateAction, DeleteAction]
}
