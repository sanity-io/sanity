import {type DocumentRevision} from '../../../history'
import {type DocumentOperationImpl} from '../operations/types'

export const restore: DocumentOperationImpl<[fromRevision: DocumentRevision]> = {
  disabled: (): false => false,
  execute: (_, _fromRevision: DocumentRevision) => {
    // TODO: This action could be moved to the restore documentAction instead of being here. It doesn't operate on the buffered document as the other actions.
    throw new Error('not implemented')
  },
}
