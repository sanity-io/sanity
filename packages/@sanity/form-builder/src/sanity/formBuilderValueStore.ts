import documentStore from 'part:@sanity/base/datastore/document'
import {map, scan} from 'rxjs/operators'
import type {Patch} from '../patch/types'
import * as gradientPatchAdapter from './utils/gradientPatchAdapter'

function prepareMutationEvent(event) {
  const patches = event.mutations.map((mut) => mut.patch).filter(Boolean)
  return {
    ...event,
    patches: gradientPatchAdapter.toFormBuilder(event.origin, patches),
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
    patches: gradientPatchAdapter.toFormBuilder('internal', patches),
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
      document.patch(gradientPatchAdapter.toGradient(patches))
    },
  }
}

let hasWarned = false
export function checkoutPair(idPair) {
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
