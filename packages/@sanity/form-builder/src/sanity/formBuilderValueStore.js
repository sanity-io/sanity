// @flow weak
import documentStore from 'part:@sanity/base/datastore/document'
import gradientPatchAdapter from './utils/gradientPatchAdapter'
import PatchEvent from '../PatchEvent'

export function checkout(documentId) {
  const local = documentStore.checkout(documentId)


  const events$ = local.events.map(event =>
    (event.type === 'mutation' ? prepareMutationEvent(event) : event)
  )

  function prepareMutationEvent(event) {
    const patches = event.mutations.map(mut => mut.patch).filter(Boolean)
    return {
      ...event,
      patches: gradientPatchAdapter.toFormBuilder(event.origin, patches)
    }
  }

  return {
    ...local,
    events: events$,
    patch(patches: Array<Patch>) {
      local.patch(gradientPatchAdapter.fromFormBuilder(patches))
    }
  }
}
