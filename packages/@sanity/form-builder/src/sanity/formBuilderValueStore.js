// @flow weak
import documentStore from 'part:@sanity/base/datastore/document'
import gradientPatchAdapter from './utils/gradientPatchAdapter'
import PatchEvent from '../PatchEvent'

export function checkout(documentId) {
  const document = documentStore.checkout(documentId)
  const events$ = document.events.map(event =>
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
    events: events$,
    patch(patches: Array<PatchEvent>) {
      document.patch(gradientPatchAdapter.fromFormBuilder(patches))
    },
    delete() {
      document.delete()
    },
    create() {
      document.create(document)
    },
    commit() {
      return document.commit()
    }
  }
}
