import {DocumentActionComponent} from '@sanity/base'
import {PublishAction} from './PublishAction'
import {DiscardChangesAction} from './DiscardChangesAction'
import {UnpublishAction} from './UnpublishAction'
import {DuplicateAction} from './DuplicateAction'
import {DeleteAction} from './DeleteAction'

export {PublishAction}
export {DiscardChangesAction}
export {UnpublishAction}
export {DuplicateAction}
export {DeleteAction}

export default function defaultResolveDocumentActions(): DocumentActionComponent[] {
  return [PublishAction, DiscardChangesAction, UnpublishAction, DuplicateAction, DeleteAction]
}
