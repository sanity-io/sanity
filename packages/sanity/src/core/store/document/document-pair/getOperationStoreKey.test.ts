import {type SanityClient} from '@sanity/client'
import {of} from 'rxjs'
import {describe, expect, it} from 'vitest'

import {getOperationStoreKey} from './getOperationStoreKey'

const clientWith = (config: {auth?: unknown; token?: string}) =>
  ({config: () => ({...config, projectId: 'p', dataset: 'd'})}) as unknown as SanityClient

describe('getOperationStoreKey', () => {
  // The key routes an emitted operation to the `operationEvents` pipeline built on the same
  // credential: the pipeline computes it once, each `OperationsAPI` computes it when it is
  // created. Under a reactive `auth`, `config().token` is the token the client last resolved,
  // so an API created after a rotation would get a different key from the pipeline's and every
  // operation it emits would be dropped: the form stays editable, but nothing is staged.
  it('is the same for a reactive client before and after a token rotation', () => {
    const auth = of(Promise.resolve({token: 'access-1'}))
    expect(getOperationStoreKey(clientWith({auth, token: 'access-1'}))).toBe(
      getOperationStoreKey(clientWith({auth, token: 'access-2'})),
    )
  })

  it('differs between two credential sources', () => {
    expect(
      getOperationStoreKey(clientWith({auth: of(Promise.resolve({token: 'access-1'}))})),
    ).not.toBe(getOperationStoreKey(clientWith({auth: of(Promise.resolve({token: 'access-1'}))})))
  })

  it('keys a static client by its token', () => {
    expect(getOperationStoreKey(clientWith({token: 'sk-1'}))).toBe(
      getOperationStoreKey(clientWith({token: 'sk-1'})),
    )
    expect(getOperationStoreKey(clientWith({token: 'sk-1'}))).not.toBe(
      getOperationStoreKey(clientWith({token: 'sk-2'})),
    )
  })
})
