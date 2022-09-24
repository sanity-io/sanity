import {map, scan} from 'rxjs/operators'
import {FIXME} from '../../FIXME'
import {
  DocumentMutationEvent,
  DocumentRebaseEvent,
  DocumentStore,
  DocumentVersion,
  DocumentVersionEvent,
  IdPair,
} from '../../store'
import {FormPatch} from '../patch'
import {fromMutationPatches, toMutationPatches} from '../utils/mutationPatch'

interface LocalMutationEvent extends DocumentMutationEvent {
  patches: FormPatch[]
}

function prepareMutationEvent(event: DocumentMutationEvent): LocalMutationEvent {
  const patches = event.mutations.map((mut) => mut.patch).filter(Boolean)
  return {
    type: 'mutation',
    document: event.document,
    mutations: event.mutations,
    patches: fromMutationPatches(event.origin, patches),
    origin: event.origin,
  }
}

function prepareRebaseEvent(event: DocumentRebaseEvent): LocalMutationEvent {
  const patches = [
    {
      id: event.document._id,
      set: event.document,
    },
  ]

  return {
    type: 'mutation',
    document: event.document,
    mutations: patches.map((patch) => ({patch})),
    patches: fromMutationPatches('internal', patches),
    origin: (event as FIXME).origin, // @todo
  }
}

function wrap(document: DocumentVersion) {
  const events$ = document.events.pipe(
    map((event) => {
      if (event.type === 'mutation') {
        return prepareMutationEvent(event)
      } else if (event.type === 'rebase') {
        return prepareRebaseEvent(event)
      }
      return event as FIXME
    }),
    scan((prevEvent: DocumentVersionEvent | null, currentEvent) => {
      const deletedSnapshot =
        prevEvent &&
        prevEvent.type === 'mutation' &&
        prevEvent.document !== null &&
        currentEvent.type === 'mutation' &&
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
    patch(patches: Array<FormPatch>) {
      document.patch(toMutationPatches(patches))
    },
  }
}

let hasWarned = false
export function checkoutPair(documentStore: DocumentStore, idPair: IdPair) {
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
