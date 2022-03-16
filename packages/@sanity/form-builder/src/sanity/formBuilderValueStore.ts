import {DocumentStore} from '@sanity/base'
import {Patch, fromMutationPatches, toMutationPatches} from '@sanity/base/_internal'
import {map, scan} from 'rxjs/operators'

function prepareMutationEvent(event) {
  const patches = event.mutations.map((mut) => mut.patch).filter(Boolean)
  return {
    ...event,
    patches: fromMutationPatches(event.origin, patches),
  }
}

function prepareRebaseEvent(event) {
  const patches = [
    {
      id: event.document._id,
      set: event.document,
    },
  ]
  return {
    type: 'mutation',
    document: event.document,
    mutations: patches.map((patch) => ({
      patch,
    })),
    patches: fromMutationPatches('internal', patches),
  }
}

function wrap(document) {
  const events$ = document.events.pipe(
    map((event: any) => {
      if (event.type === 'mutation') {
        return prepareMutationEvent(event)
      } else if (event.type === 'rebase') {
        return prepareRebaseEvent(event)
      }
      return event
    }),
    scan((prevEvent, currentEvent: any) => {
      const deletedSnapshot =
        prevEvent &&
        currentEvent.type === 'mutation' &&
        prevEvent.document !== null &&
        currentEvent.document === null
          ? prevEvent.document
          : null

      return {
        ...currentEvent,
        deletedSnapshot,
      }
    }, null)
  )

  return {
    ...document,
    events: events$,
    patch(patches: Array<Patch>) {
      document.patch(toMutationPatches(patches))
    },
  }
}

let hasWarned = false
export function checkoutPair(documentStore: DocumentStore, idPair) {
  if (!hasWarned) {
    // eslint-disable-next-line no-console
    console.warn(
      '[deprecation] The checkout() function has been deprecated in favor of checkoutPair()'
    )
    hasWarned = true
  }
  const {draft, published} = documentStore.checkoutPair(idPair)

  return {
    draft: wrap(draft),
    published: wrap(published),
  }
}
