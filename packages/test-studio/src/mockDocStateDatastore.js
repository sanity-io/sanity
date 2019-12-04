import {concat, of, Subject, merge, NEVER} from 'rxjs'
import {filter, map, switchMap} from 'rxjs/operators'
import {Mutation} from '@sanity/mutator'

const INITIAL_DOC_RECORD = {
  id: 'mock-document',
  document: null,
  published: null,
  draft: null,
  isLiveEdit: false,
  deleted: false
}

const USERS = [
  {id: 'bjoerge', displayName: 'Bjørge (w)'},
  {id: 'per-kristian', displayName: 'Per-Kristian (a)'},
  {id: 'simen', displayName: 'Simen (w)'},
  {id: 'jemmima', displayName: 'Jemmima (p)'},
  {id: 'marius', displayName: 'Marius (p)'}
]

const POLICY_DOC = {
  id: 'mock-policy-document',
  published: {
    _id: 'mock-policy-document',
    permissions: [
      {_type: 'permission', userId: 'bjoerge', access: 'write'},
      {_type: 'permission', userId: 'per-kristian', access: 'approve'},
      {_type: 'permission', userId: 'simen', access: 'write'},
      {_type: 'permission', userId: 'jemmima', access: 'publish'},
      {_type: 'permission', userId: 'marius', access: 'publish'}
    ]
  },
  isLiveEdit: true,
  deleted: false
}

function createAction() {
  const actions$ = new Subject()
  return [actions$.asObservable(), val => actions$.next(val)]
}

const [action$, emitAction] = createAction()
const [currentUserId$, setCurrentUserId] = createAction()

const RECORDS = {
  [INITIAL_DOC_RECORD.id]: INITIAL_DOC_RECORD,
  [POLICY_DOC.id]: POLICY_DOC
}

function update(id, record) {
  RECORDS[id] = record
  return record
}

function get(id) {
  return RECORDS[id]
}
const identity = v => v

function setPatchId(id) {
  return mutation => (mutation.patch ? {...mutation, patch: {...mutation.patch, id: id}} : mutation)
}

const handlers = {
  publish: (id, prepare) => {
    const current = get(id)
    return update(id, {...current, draft: null, published: prepare(current.draft), deleted: false})
  },
  create: (id, doc) => {
    const current = get(id)
    const created = {...doc, _id: `drafts.${current.id}`}
    return update(id, {
      ...current,
      draft: current.isLiveEdit ? current.draft : created,
      published: current.isLiveEdit ? created : current.published,
      deleted: false
    })
  },
  mutate: (id, mutations) => {
    const current = get(id)
    const target = current.isLiveEdit ? current.published : current.draft
    const nextDoc = new Mutation({
      mutations: mutations.map(setPatchId(target._id))
    }).apply(target)

    return update(id, {
      ...current,
      published: current.isLiveEdit ? nextDoc : current.published,
      draft: current.isLiveEdit ? current.draft : nextDoc,
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

export const getUser = id => {
  return of(USERS.find(u => u.id === id))
}

export const allUsers$ = merge(of(USERS), NEVER)

export const currentUser$ = concat(of('bjoerge'), currentUserId$).pipe(switchMap(getUser))

export {setCurrentUserId}

export const listenDocRecord = id =>
  concat(
    of(get(id)),
    action$.pipe(
      filter(action => action[1] === id),
      map(action => handlers[action[0]](...action.slice(1)))
    )
  ).pipe(
    map(record => ({
      ...record,
      document: record.isLiveEdit ? record.published : record.draft || record.published
    }))
  )

export const publish = (id, prepare = identity) => emitAction(['publish', id, prepare])
export const unpublish = id => emitAction(['unpublish', id])
export const create = (id, doc) => emitAction(['create', id, doc])
export const mutate = (id, mutations) => emitAction(['mutate', id, mutations])
export const duplicate = (id, dupedId, prepare = identity) =>
  emitAction(['duplicate', id, dupedId, prepare])
export const del = id => emitAction(['del', id])
