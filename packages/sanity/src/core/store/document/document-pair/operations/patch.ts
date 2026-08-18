import {
  assertNotVariantVersion,
  disabledForVariantVersion,
  type VariantVersionDisabledReason,
} from '../utils/assertNotVariantVersion'
import {isLiveEditEnabled} from '../utils/isLiveEditEnabled'
import {type OperationImpl} from './types'

// todo: we could also consider exposing 'mutate' directly
export const patch: OperationImpl<
  [patches: any[], initialDocument?: Record<string, any>],
  VariantVersionDisabledReason
> = {
  // Legacy local patch. Variant-scoped versions are disabled here — use `serverOperations/patch.ts`
  // instead.
  disabled: ({snapshots}) => disabledForVariantVersion(snapshots?.version),
  execute: (
    {schema, snapshots, idPair, draft, published, version, typeName},
    patches = [],
    initialDocument,
  ): void => {
    assertNotVariantVersion(snapshots.version, 'patch')
    if (version) {
      // No drafting, so patch and commit the version document.
      version.mutate([
        version.createIfNotExists({
          _type: typeName,
          ...initialDocument,
        }),
        ...version.patch(patches),
      ])
      return
    }

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
