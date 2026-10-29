import {describe, expect, it} from 'vitest'

import {actionsToMutations} from './actionsToMutations'
import {ContentLakeError} from './contentLakeError'
import {type ContentLakeAction} from './types'

const PUBLISHED = {_id: 'a', _type: 'doc', _rev: 'seed', title: 'published'}

function edit(patch: Record<string, unknown>): ContentLakeAction {
  return {actionType: 'sanity.action.document.edit', draftId: 'drafts.a', publishedId: 'a', patch}
}

describe('actionsToMutations', () => {
  it('patches an existing draft directly', () => {
    const index = {'drafts.a': {...PUBLISHED, _id: 'drafts.a'}}
    expect(actionsToMutations(index, [edit({set: {title: 'x'}})])).toEqual([
      {patch: {id: 'drafts.a', set: {title: 'x'}}},
    ])
  })

  it('materialises a missing draft from the published document', () => {
    expect(actionsToMutations({a: PUBLISHED}, [edit({set: {title: 'x'}})])).toEqual([
      {createIfNotExists: {_id: 'drafts.a', _type: 'doc', title: 'published'}},
      {patch: {id: 'drafts.a', set: {title: 'x'}}},
    ])
  })

  it('materialises a stub typed from the patch when neither document exists', () => {
    const [materialise] = actionsToMutations({}, [edit({set: {_type: 'article'}})])
    expect(materialise).toEqual({createIfNotExists: {_id: 'drafts.a', _type: 'article'}})
  })

  it('rejects a create with ifExists fail on an existing document with a 409', () => {
    const create = () =>
      actionsToMutations({a: PUBLISHED}, [
        {
          actionType: 'sanity.action.document.create',
          publishedId: 'a',
          attributes: {_id: 'a', _type: 'doc'},
          ifExists: 'fail',
        },
      ])
    expect(create).toThrow(expect.objectContaining({statusCode: 409}))
  })

  it('rejects an unsupported action with a 400', () => {
    const unsupported = () =>
      actionsToMutations({}, [{actionType: 'sanity.action.document.publish'} as never])
    expect(unsupported).toThrow(ContentLakeError)
    expect(unsupported).toThrow(expect.objectContaining({statusCode: 400}))
  })
})
