import type {OperationArgs} from '../../types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

// todo: we could also consider exposing 'mutate' directly
export const patch = {
  disabled: (): false => false,
  execute: (
    {schema, snapshots, idPair, draft, published, typeName}: OperationArgs,
    patches = [],
    initialValue: any
  ): void => {
    if (isLiveEditEnabled(schema, typeName)) {
      // No drafting, so patch and commit the published document
      published.mutate([
        published.createIfNotExists({
          _type: typeName,
          ...initialValue,
        }),
        ...published.patch(patches),
      ])
    } else {
      draft.mutate([
        draft.createIfNotExists({
          ...initialValue,
          ...snapshots.published,
          _id: idPair.draftId,
          _type: typeName,
        }),
        ...draft.patch(patches),
      ])
    }
  },
}
