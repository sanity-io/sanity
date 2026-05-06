import {actionsApiClient} from '../../document-pair/utils/actionsApiClient'
import {isLiveEditEnabled} from '../../document-pair/utils/isLiveEditEnabled'
import {type DocumentOperationImpl} from '../operations/types'
import {isDraftDocument} from './utils'

type DisabledReason =
  | 'LIVE_EDIT_ENABLED'
  | 'ALREADY_PUBLISHED'
  | 'NO_CHANGES'
  | 'VERSION_CANT_BE_PUBLISHED'

export const publish: DocumentOperationImpl<[], DisabledReason> = {
  disabled: ({schema, typeName, snapshot, publishedId}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      return 'LIVE_EDIT_ENABLED'
    }
    if (!snapshot) {
      return publishedId ? 'ALREADY_PUBLISHED' : 'NO_CHANGES'
    }
    if (isDraftDocument(snapshot)) {
      // Only draft documents can be published.
      return false
    }

    return 'VERSION_CANT_BE_PUBLISHED'
  },
  execute: ({client, snapshot, target}) => {
    if (!snapshot) {
      throw new Error('cannot execute "publish" when snapshot is missing')
    }
    if (!isDraftDocument(snapshot)) {
      throw new Error('cannot execute "publish" when snapshot is not a draft')
    }

    return actionsApiClient(client).observable.action(
      {
        actionType: 'sanity.action.document.publish',
        draftId: snapshot._id,
        publishedId: target.baseId,
        /**
         * TODO:
         * Do we really need this?
         * The studio is not showing you anything regarding the published document when you click the publish action in the draft or an anonymous version.
         * So if two users click publish concurrently, why do we need to force one of the two to fail? And if it fails, it can just click again publish and it will pass because the _rev will be updated.
         */
        // ifPublishedRevisionId: publishedEquivalent?._rev,
      },
      {
        tag: 'document.publish',
      },
    )
  },
}
