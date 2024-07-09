import {type ObjectSchemaType, type SanityClient, type SanityDocument} from 'sanity'

type DisabledReason = 'LIVE_EDIT_ENABLED' | 'ALREADY_PUBLISHED' | 'NO_CHANGES'

interface Validation {
  id: string
  reason: DisabledReason
}

export const batchPublish = ({
  schemaType,
  client,
  items,
}: {
  schemaType: ObjectSchemaType
  client: SanityClient
  items: {
    idPair: {draftId: string; publishedId: string}
    snapshots: {draft: null | SanityDocument; published: null | SanityDocument}
  }[]
}) => {
  return {
    disabled: () => {
      if (schemaType.liveEdit) {
        return [{id: 'all', reason: 'LIVE_EDIT_ENABLED'}]
      }
      const errors = items
        .map(({snapshots, idPair}) => {
          if (!snapshots.draft) {
            const reason = snapshots.published ? 'ALREADY_PUBLISHED' : 'NO_CHANGES'
            return {id: idPair.publishedId, reason: reason} as Validation
          }
          return false
        })
        .filter(Boolean) as Validation[]

      return errors.length > 0 ? errors : false
    },
    execute: () => {
      const vXClient = client.withConfig({apiVersion: 'X'})
      const {dataset} = client.config()
      return vXClient.observable.request({
        url: `/data/actions/${dataset}`,
        method: 'post',
        tag: 'document.publish',
        body: {
          actions: [
            ...items.map(({idPair, snapshots}) => {
              if (!snapshots.draft)
                throw new Error('cannot execute "publish" when draft is missing')
              return {
                actionType: 'sanity.action.document.publish',
                draftId: idPair.draftId,
                publishedId: idPair.publishedId,
                // The editor must be able to see the latest state of both the draft document they are
                // publishing, and the published document they are choosing to replace. Optimistic
                // locking using `ifDraftRevisionId` and `ifPublishedRevisionId` ensures the client and
                // server are synchronised.
                ifDraftRevisionId: snapshots.draft._rev,
                ifPublishedRevisionId: snapshots.published?._rev,
              }
            }),
          ],
        },
      })
    },
  }
}
