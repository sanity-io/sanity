import {describe, expect, it} from 'vitest'

import {actionsToMutations} from './actionsToMutations'
import {ContentLakeError} from './contentLakeError'
import {type ContentLakeAction, type ContentLakeDocument} from './types'

const PUBLISHED = {
  _id: 'a',
  _type: 'doc',
  _rev: 'seed',
  _createdAt: '2026-01-01T00:00:00.000Z',
  title: 'published',
}

function edit(patch: Record<string, unknown>): ContentLakeAction {
  return {actionType: 'sanity.action.document.edit', draftId: 'drafts.a', publishedId: 'a', patch}
}

function create(attributes: ContentLakeDocument, ifExists?: 'fail' | 'ignore'): ContentLakeAction {
  return {
    actionType: 'sanity.action.document.create',
    publishedId: 'a',
    attributes,
    ...(ifExists ? {ifExists} : {}),
  }
}

function errorOf(run: () => unknown): ContentLakeError {
  try {
    run()
  } catch (error) {
    if (error instanceof ContentLakeError) return error
    throw error
  }
  throw new Error('Expected a ContentLakeError')
}

describe('actionsToMutations', () => {
  it('patches an existing draft directly', () => {
    const index = {'drafts.a': {...PUBLISHED, _id: 'drafts.a'}}
    expect(actionsToMutations(index, [edit({set: {title: 'x'}})])).toEqual([
      {patch: {id: 'drafts.a', set: {title: 'x'}, unsetIsEmpty: false}},
    ])
  })

  it('patches a draft that exists without a published document', () => {
    const index = {'drafts.a': {_id: 'drafts.a', _type: 'doc', _rev: 'draft-rev'}}
    expect(actionsToMutations(index, [edit({set: {title: 'x'}})])).toEqual([
      {patch: {id: 'drafts.a', set: {title: 'x'}, unsetIsEmpty: false}},
    ])
  })

  it('creates a missing draft from the published document and records its base', () => {
    expect(actionsToMutations({a: PUBLISHED}, [edit({set: {title: 'x'}})])).toEqual([
      {create: {...PUBLISHED, _id: 'drafts.a'}},
      {patch: {id: 'drafts.a', set: {'_system.base.id': 'a'}, unsetIsEmpty: false}},
      {patch: {id: 'drafts.a', set: {'_system.base.rev': 'seed'}, unsetIsEmpty: false}},
      {patch: {id: 'drafts.a', set: {title: 'x'}, unsetIsEmpty: false}},
    ])
  })

  it('rejects an edit when neither the draft nor the published document exists with a 404', () => {
    const error = errorOf(() => actionsToMutations({}, [edit({set: {_type: 'doc', title: 'x'}})]))
    expect(error.statusCode).toBe(404)
    expect(error.body).toEqual({
      description: 'The document with the ID "a" was not found',
      id: 'a',
      type: 'documentNotFoundError',
    })
  })

  it('rejects ifRevisionID inside an edit patch as an unknown field with a 400', () => {
    const index = {'drafts.a': {...PUBLISHED, _id: 'drafts.a'}}
    const error = errorOf(() =>
      actionsToMutations(index, [edit({ifRevisionID: 'seed', set: {title: 'x'}})]),
    )
    expect(error.statusCode).toBe(400)
    expect(error.body).toEqual({
      bodyTruncated: false,
      description: 'json: unknown field "ifRevisionID"',
      type: 'httpInvalidRequestBody',
    })
  })

  it('lets an edit see the draft that an earlier action in the same request created', () => {
    const mutations = actionsToMutations({}, [
      create({_id: 'drafts.a', _type: 'doc', title: 'a'}, 'fail'),
      edit({set: {title: 'b'}}),
    ])
    expect(mutations).toEqual([
      {createOrReplace: {_id: 'drafts.a', _type: 'doc', title: 'a'}},
      {patch: {id: 'drafts.a', set: {title: 'b'}, unsetIsEmpty: false}},
    ])
  })

  it('creates the draft from published only once across edits in the same request', () => {
    const mutations = actionsToMutations({a: PUBLISHED}, [
      edit({set: {title: 'one'}}),
      edit({inc: {count: 1}}),
    ])
    expect(mutations.filter((mutation) => mutation.create)).toHaveLength(1)
    expect(mutations.at(-1)).toEqual({
      patch: {id: 'drafts.a', inc: {count: 1}, unsetIsEmpty: false},
    })
  })

  it('creates a draft with createOrReplace when no version of the document exists', () => {
    expect(actionsToMutations({}, [create({_id: 'drafts.a', _type: 'doc'}, 'fail')])).toEqual([
      {createOrReplace: {_id: 'drafts.a', _type: 'doc'}},
    ])
  })

  it.each([
    {existing: 'drafts.a', ifExists: 'fail' as const},
    {existing: 'drafts.a', ifExists: undefined},
    {existing: 'a', ifExists: 'fail' as const},
  ])(
    'rejects a create when $existing exists and ifExists is $ifExists with a 409',
    ({existing, ifExists}) => {
      const index = {[existing]: {...PUBLISHED, _id: existing}}
      const error = errorOf(() =>
        actionsToMutations(index, [create({_id: 'drafts.a', _type: 'doc'}, ifExists)]),
      )
      expect(error.statusCode).toBe(409)
      expect(error.body).toEqual({
        description: 'there is already a version of a document for published ID "a"',
        id: existing,
        type: 'documentAlreadyExistsError',
      })
    },
  )

  it.each(['drafts.a', 'a'])(
    'writes nothing for a create with ifExists ignore when %s exists',
    (existing) => {
      const index = {[existing]: {...PUBLISHED, _id: existing}}
      expect(
        actionsToMutations(index, [create({_id: 'drafts.a', _type: 'doc'}, 'ignore')]),
      ).toEqual([])
    },
  )

  it('rejects a create whose attributes._id is not a draft or version id with a 400', () => {
    const error = errorOf(() => actionsToMutations({}, [create({_id: 'a', _type: 'doc'}, 'fail')]))
    expect(error.statusCode).toBe(400)
    expect(error.body).toEqual({
      description:
        'action index 0: "attributes._id" must be prefixed with either "drafts." or "versions.{bundleId}"',
      type: 'httpBadRequest',
    })
  })

  it('rejects an unsupported action with a 400', () => {
    const unsupported = () =>
      actionsToMutations({}, [{actionType: 'sanity.action.document.publish'} as never])
    expect(unsupported).toThrow(ContentLakeError)
    expect(unsupported).toThrow(expect.objectContaining({statusCode: 400}))
  })
})
