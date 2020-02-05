import {OperationArgs} from '../../types'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'

export const patch = {
  disabled: (): false => false,
  execute: ({snapshots, idPair, draft, published, typeName}: OperationArgs, patches = []): void => {
    if (isLiveEditEnabled(typeName)) {
      // No drafting, so patch and commit the published document
      published.mutate([
        published.createIfNotExists({
          _type: typeName
        }),
        ...published.patch(patches)
      ])
    } else {
      draft.mutate([
        draft.createIfNotExists({
          ...snapshots.published,
          _id: idPair.draftId,
          _type: typeName
        }),
        ...draft.patch(patches)
      ])
    }
  }
}
