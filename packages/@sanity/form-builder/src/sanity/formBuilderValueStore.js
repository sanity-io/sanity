// @flow weak
import documentStore from 'part:@sanity/base/datastore/document'
import gradientPatchAdapter from './utils/gradientPatchAdapter'

export function checkout(documentId) {

  const document = documentStore.checkout(documentId)

  const events$ = document.events
    .map(event => (event.type === 'mutation' ? preparePatchEvent(event) : event))
    .scan((prevEvent, currentEvent) => {

      const deletedSnapshot = (
        prevEvent && currentEvent.type === 'mutation' && prevEvent.document !== null && currentEvent.document === null
      )
        ? prevEvent.document
        : null

      return {
        ...currentEvent,
        deletedSnapshot
      }

    }, null)

  function preparePatchEvent(event) {
    const patches = event.mutations.map(mut => mut.patch).filter(Boolean)
    return {
      ...event,
      patches: gradientPatchAdapter.toFormBuilder(event.origin, patches)
    }
  }

  return {
    ...document,
    events: events$,
    patch(patches: Array<Patch>) {
      document.patch(gradientPatchAdapter.fromFormBuilder(patches))
    }
  }
}
