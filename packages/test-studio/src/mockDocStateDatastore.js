import {concat, of, Subject} from 'rxjs'
import {filter, map} from 'rxjs/operators'
import {Mutation} from '@sanity/mutator'

const INITIAL_DOC_RECORD = {
  id: 'mock-document',
  published: null,
  draft: null,
  isLiveEdit: false,
  deleted: false
}

function createAction() {
  const actions$ = new Subject()
  return [actions$.asObservable(), val => actions$.next(val)]
}

const [action$, emitAction] = createAction()

const RECORDS = {
  [INITIAL_DOC_RECORD.id]: INITIAL_DOC_RECORD
}

function update(id, record) {
  RECORDS[id] = record
  return record
}

function get(id) {
  return RECORDS[id]
}
const identity = v => v
const handlers = {
  publish: (id, prepare) => {
    const current = get(id)
    return update(id, {...current, draft: null, published: prepare(current.draft), deleted: false})
  },
  create: (id, doc) => {
    const current = get(id)
    return update(id, {
      ...current,
      draft: {...doc, _id: `drafts.${current.id}`},
      published: current.published,
      deleted: false
    })
  },
  mutate: (id, mutations) => {
    const current = get(id)

    const nextDraft = new Mutation({mutations: mutations}).apply(current.draft)
    return update(id, {
      ...current,
      draft: nextDraft,
      deleted: false
    })
  },
  duplicate: (id, dupeId, prepare) => {
    const current = get(id)
    const prevDoc = current.draft || current.published
    return update(dupeId, {
      ...current,
      id: dupeId,
      published: null,
      draft: {...prepare(prevDoc), _id: `drafts.${dupeId}`},
      deleted: false
    })
  },
  unpublish: id => {
    const current = get(id)
    return update(id, {
      ...current,
      published: null,
      draft: current.draft || current.published,
      deleted: false
    })
  },
  del: id => {
    const current = get(id)
    return update(id, {
      ...current,
      id: id,
      deleted: true,
      published: null,
      draft: null
    })
  }
}

export const listenDocRecord = id =>
  concat(
    of(get(id)),
    action$.pipe(
      filter(action => action[1] === id),
      map(action => handlers[action[0]](...action.slice(1)))
    )
  )

export const publish = (id, prepare = identity) => emitAction(['publish', id, prepare])
export const unpublish = id => emitAction(['unpublish', id])
export const create = (id, doc) => emitAction(['create', id, doc])
export const mutate = (id, mutations) => emitAction(['mutate', id, mutations])
export const duplicate = (id, dupedId, prepare = identity) =>
  emitAction(['duplicate', id, dupedId, prepare])
export const del = id => emitAction(['del', id])
