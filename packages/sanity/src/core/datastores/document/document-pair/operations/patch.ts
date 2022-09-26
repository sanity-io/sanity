import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {OperationImpl} from './types'

// todo: we could also consider exposing 'mutate' directly
export const patch: OperationImpl<[patches: any[], initialDocument: Record<string, any>]> = {
  disabled: (): false => false,
  execute: (
    {schema, snapshots, idPair, draft, published, typeName},
    patches = [],
    initialDocument
  ): void => {
    if (isLiveEditEnabled(schema, typeName)) {
      // No drafting, so patch and commit the published document
      published.mutate([
        published.createIfNotExists({
          _type: typeName,
          ...initialDocument,
        }),
        ...published.patch(patches),
      ])
    } else {
      draft.mutate([
        draft.createIfNotExists({
          ...initialDocument,
          ...snapshots.published,
          _id: idPair.draftId,
          _type: typeName,
        }),
        ...draft.patch(patches),
      ])
    }
  },
}
