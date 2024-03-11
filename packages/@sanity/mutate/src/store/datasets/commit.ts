import {type SanityDocumentBase} from '../../mutations/types'
import {type Dataset} from '../types'
import {type UpdateResult} from './applyMutations'

export function commit<Doc extends SanityDocumentBase>(
  results: UpdateResult<Doc>[],
  dataset: Dataset<Doc>,
) {
  results.forEach(result => {
    if (result.status === 'created' || result.status === 'updated') {
      dataset.set(result.id, result.after)
    }
    if (result.status === 'deleted') {
      dataset.delete(result.id)
    }
  })
}
