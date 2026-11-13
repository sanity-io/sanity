import {describe, expect, it, vi} from 'vitest'

import {createDefaultVersion} from './createDefaultVersion'

function setup() {
  const action = vi.fn().mockResolvedValue({transactionId: 'transaction'})
  const {signal} = new AbortController()
  return {client: {action}, action, signal}
}

describe('createDefaultVersion', () => {
  it('copies the base version into drafts', async () => {
    const {client, action, signal} = setup()

    await createDefaultVersion({
      client,
      documentGroupId: 'article',
      documentType: 'article',
      bundleId: undefined,
      base: {_id: 'versions.rSummer.article', _rev: 'rev-1'},
      signal,
    })

    expect(action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.document.version.create',
        publishedId: 'article',
        versionId: 'drafts.article',
        baseId: 'versions.rSummer.article',
        ifBaseRevisionId: 'rev-1',
      },
      {tag: 'document.create-version', signal},
    )
  })

  it('copies the base version into a release', async () => {
    const {client, action, signal} = setup()

    await createDefaultVersion({
      client,
      documentGroupId: 'article',
      documentType: 'article',
      bundleId: 'rSummer',
      base: {_id: 'article'},
      signal,
    })

    expect(action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.document.version.create',
        publishedId: 'article',
        versionId: 'versions.rSummer.article',
        baseId: 'article',
      },
      {tag: 'document.create-version', signal},
    )
  })

  it('creates an empty version when there is no base version', async () => {
    const {client, action, signal} = setup()

    await createDefaultVersion({
      client,
      documentGroupId: 'article',
      documentType: 'article',
      bundleId: 'rSummer',
      base: undefined,
      signal,
    })

    expect(action).toHaveBeenCalledWith(
      {
        actionType: 'sanity.action.document.version.create',
        publishedId: 'article',
        document: {_id: 'versions.rSummer.article', _type: 'article'},
      },
      {tag: 'document.create-version', signal},
    )
  })
})
