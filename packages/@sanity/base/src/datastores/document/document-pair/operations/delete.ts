import {versionedClient} from '../../../../client/versionedClient'
import type {OperationArgs} from '../../types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const del = {
  disabled: ({snapshots}) => (snapshots.draft || snapshots.published ? false : 'NOTHING_TO_DELETE'),
  execute: ({idPair, typeName}: OperationArgs) => {
    const tx = versionedClient.observable.transaction().delete(idPair.publishedId)

    if (isLiveEditEnabled(typeName)) {
      return tx.commit({tag: 'document.delete'})
    }

    return tx.delete(idPair.draftId).commit({tag: 'document.delete'})
  },
}
