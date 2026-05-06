import {type DocumentRevision} from '../../../history'
import {type DocumentOperationImpl} from '../operations/types'

export const restore: DocumentOperationImpl<[fromRevision: DocumentRevision]> = {
  disabled: (): false => false,
  execute: (_, _fromRevision: DocumentRevision) => {
    // TODO: This action could be moved to the restore documentAction instead of being here. It doesn't operate on the buffered document as the other actions.
    throw new Error('not implemented')
    // const publishedEquivalent = findPublishedEquivalent(target, versions)
    // const targetId = idPair.versionId
    //   ? idPair.versionId
    //   : isLiveEditEnabled(schema, typeName)
    //     ? idPair.publishedId
    //     : idPair.draftId

    //     const draft = findDraftEquivalent(target, versions)
    //     const published = findPublishedEquivalent(target, versions)
    // return historyStore.restore(publishedEquivalent._id, targetId, fromRevision, {
    //   fromDeleted: !snapshots.draft && !snapshots.published,
    //   useServerDocumentActions: true,
    // })
  },
}
