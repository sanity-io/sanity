import {from} from 'rxjs'
import {switchMap} from 'rxjs/operators'

import {getPublishedId} from '../../../../../util/draftUtils'
import {type OperationImpl} from '../operations/types'
import {actionsApiClient} from '../utils/actionsApiClient'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const del: OperationImpl<[], 'NOTHING_TO_DELETE'> = {
  disabled: ({snapshots}) => (snapshots.draft || snapshots.published ? false : 'NOTHING_TO_DELETE'),
  execute: ({client, schema, idPair, typeName, snapshots}) => {
    if (isLiveEditEnabled(schema, typeName)) {
      const tx = client.observable.transaction().delete(idPair.publishedId)
      return tx.commit({tag: 'document.delete'})
    }

    const publishedId = getPublishedId(idPair.publishedId)

    return from(
      client.fetch<string[]>(
        `*[sanity::versionOf($publishedId)]._id`,
        {publishedId},
        {tag: 'document.delete'},
      ),
    ).pipe(
      switchMap((allVersionIds) => {
        if (snapshots.published) {
          return actionsApiClient(client, idPair).observable.action(
            {
              actionType: 'sanity.action.document.delete',
              includeDrafts: allVersionIds.filter((id) => id !== publishedId),
              publishedId,
            },
            {
              tag: 'document.delete',
              skipCrossDatasetReferenceValidation: true,
            },
          )
        }

        return from(
          actionsApiClient(client, idPair).action(
            allVersionIds.map((versionId) => ({
              actionType: 'sanity.action.document.version.discard' as const,
              versionId,
            })),
            {
              tag: 'document.delete',
              skipCrossDatasetReferenceValidation: true,
            },
          ),
        )
      }),
    )
  },
}
