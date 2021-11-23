import {first} from 'rxjs/operators'
import {Grant} from './types'
import * as exampleGrants from './debug/exampleGrants'

interface TestOptions {
  liveEdit: boolean
  documentPair: {draft: unknown; published: unknown}
  grants: Grant[]
}

function setupTest({documentPair, grants, liveEdit}: TestOptions) {
  jest.resetModules()

  jest.mock('part:@sanity/base/client', () => {
    const mockConfig = {
      useCdn: false,
      projectId: 'mock-project-id',
      dataset: 'mock-data-set',
      apiVersion: '1',
    }

    const mockClient = {
      config: () => mockConfig,
      withConfig: () => mockClient,
      request: jest.fn(() => Promise.resolve(grants)),
    }

    return mockClient
  })

  jest.mock('../user', () => ({
    getCurrentUser: () => Promise.resolve({id: 'example-user-id'}),
  }))

  jest.mock('part:@sanity/base/schema', () => {
    return {get: () => ({liveEdit})}
  })

  jest.mock('../document/document-pair/snapshotPair', () => {
    const {of} = require('rxjs')
    return {
      snapshotPair: jest.fn(() =>
        of({
          draft: {snapshots$: of(null, documentPair.draft)},
          published: {snapshots$: of(null, documentPair.published)},
        })
      ),
    }
  })

  /* eslint-disable camelcase */
  const getDocumentPairPermissions = require('./documentPairPermissions')
    .unstable_getDocumentPairPermissions as typeof import('./documentPairPermissions').unstable_getDocumentPairPermissions
  /* eslint-enable camelcase */

  type ArgType<T> = T extends (arg: infer U) => unknown ? U : never

  return (arg: ArgType<typeof getDocumentPairPermissions>) =>
    getDocumentPairPermissions(arg).pipe(first()).toPromise()
}

describe('getDocumentPairPermissions', () => {
  it('accepts an id, type, and permission and returns an observable of PermissionCheckResult', async () => {
    const getDocumentPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book'},
        published: {_id: 'book-id', _type: 'book'},
      },
    })

    const permissions = await getDocumentPairPermissions({
      id: 'book-id',
      permission: 'update',
      type: 'book',
    })

    expect(permissions).toEqual({
      granted: true,
      reason: '',
    })
  })

  it('is draft-model aware, combining reasons when not allowed', async () => {
    const getDocumentPairPermissions = setupTest({
      grants: exampleGrants.viewer,
      liveEdit: false,
      documentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book'},
        published: {_id: 'book-id', _type: 'book'},
      },
    })

    const permissions = await getDocumentPairPermissions({
      id: 'book-id',
      permission: 'publish',
      type: 'book',
    })

    expect(permissions).toEqual({
      granted: false,
      reason:
        'Unable to publish:\n' +
        '\tnot allowed to update published document at its current state: No matching grants found\n' +
        '\tnot allowed to delete draft document: No matching grants found\n' +
        '\tnot allowed to create published document from draft: No matching grants found',
    })
  })
})

describe('getPairPermission', () => {
  it("disallows `delete` if either the published or draft can't be deleted", async () => {
    const documentPair = {
      draft: {_id: 'drafts.book-id', _type: 'book'},
      published: {_id: 'book-id', _type: 'book'},
    }

    const getContributorPairPermissions = setupTest({
      grants: exampleGrants.contributor,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getContributorPairPermissions({
        id: 'book-id',
        permission: 'delete',
        type: 'book',
      })
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to delete:\n' +
        '\tnot allowed to delete published document: No matching grants found',
    })

    const getAdminPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'delete',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `discardDraft` if the draft can't be deleted", async () => {
    const documentPair = {
      draft: {_id: 'drafts.book-id', _type: 'book'},
      published: {_id: 'book-id', _type: 'book'},
    }

    const getContributorPairPermissions = setupTest({
      grants: exampleGrants.viewer,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getContributorPairPermissions({
        id: 'book-id',
        permission: 'discardDraft',
        type: 'book',
      })
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to discardDraft:\n\tnot allowed to delete draft document: No matching grants found',
    })

    const getAdminPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'discardDraft',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `publish` if the draft can't be deleted or if a published can't be created from the draft", async () => {
    const documentPair = {
      draft: {_id: 'drafts.book-id', _type: 'book', locked: false},
      published: {_id: 'book-id', _type: 'book', locked: true},
    }

    const getRequiresApprovalPairPermissions = setupTest({
      grants: exampleGrants.requiresApproval,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getRequiresApprovalPairPermissions({
        id: 'book-id',
        permission: 'publish',
        type: 'book',
      })
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to publish:\n' +
        '\tnot allowed to update published document at its current state: No matching grants found',
    })

    const getAdminPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'publish',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `unpublish` if the published can't be deleted or if a draft can't be created from the published", async () => {
    const documentPair = {
      draft: {_id: 'drafts.book-id', _type: 'book', locked: true},
      published: {_id: 'book-id', _type: 'book', locked: false},
    }

    const getRequiresApprovalPairPermissions = setupTest({
      grants: exampleGrants.requiresApproval,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getRequiresApprovalPairPermissions({
        id: 'book-id',
        permission: 'unpublish',
        type: 'book',
      })
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to unpublish:\n' +
        '\tnot allowed to update draft document at its current state: No matching grants found',
    })

    const getAdminPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'unpublish',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `update` if the draft can't be updated", async () => {
    const documentPair = {
      draft: {_id: 'drafts.book-id', _type: 'book', locked: true},
      published: {_id: 'book-id', _type: 'book', locked: false},
    }

    const getRequiresApprovalPairPermissions = setupTest({
      grants: exampleGrants.requiresApproval,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getRequiresApprovalPairPermissions({
        id: 'book-id',
        permission: 'update',
        type: 'book',
      })
    ).resolves.toEqual({
      granted: false,
      reason: 'Unable to update:\n\tnot allowed to update draft document: No matching grants found',
    })

    const getAdminPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'update',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `duplicate` if a new document can't be created with the contents of the draft", async () => {
    const documentPair = {
      draft: {_id: 'drafts.book-id', _type: 'book', locked: true},
      published: {_id: 'book-id', _type: 'book', locked: false},
    }

    const getRequiresApprovalPairPermissions = setupTest({
      grants: exampleGrants.requiresApproval,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getRequiresApprovalPairPermissions({
        id: 'book-id',
        permission: 'duplicate',
        type: 'book',
      })
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to duplicate:\n' +
        '\tnot allowed to create new draft document from existing draft: No matching grants found',
    })

    const getAdminPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'duplicate',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })
})

describe('getPairPermission (live-edit)', () => {
  it('returns granted for non-applicable operations', async () => {
    const documentPair = {
      draft: null,
      published: {_id: 'book-id', _type: 'book'},
    }

    const getDocumentPairPermissions = setupTest({
      grants: exampleGrants.viewer,
      liveEdit: true,
      documentPair,
    })

    await expect(
      getDocumentPairPermissions({id: 'book-id', permission: 'discardDraft', type: 'book'})
    ).resolves.toEqual({granted: true, reason: ''})
    await expect(
      getDocumentPairPermissions({id: 'book-id', permission: 'publish', type: 'book'})
    ).resolves.toEqual({granted: true, reason: ''})
    await expect(
      getDocumentPairPermissions({id: 'book-id', permission: 'unpublish', type: 'book'})
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `delete` if the published can't be deleted", async () => {
    const documentPair = {
      draft: null,
      published: {_id: 'book-id', _type: 'book'},
    }

    const getContributorPairPermissions = setupTest({
      grants: exampleGrants.contributor,
      liveEdit: true,
      documentPair,
    })

    await expect(
      getContributorPairPermissions({
        id: 'book-id',
        permission: 'delete',
        type: 'book',
      })
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to delete:\n' +
        '\tnot allowed to delete published document (live-edit): No matching grants found',
    })

    const getAdminPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'delete',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `update` if the published can't be updated", async () => {
    const documentPair = {
      draft: null,
      published: {_id: 'book-id', _type: 'book', locked: true},
    }

    const getRequiresApprovalPairPermissions = setupTest({
      grants: exampleGrants.requiresApproval,
      liveEdit: true,
      documentPair,
    })

    await expect(
      getRequiresApprovalPairPermissions({
        id: 'book-id',
        permission: 'update',
        type: 'book',
      })
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to update:\n\tnot allowed to update published document (live-edit): No matching grants found',
    })

    const getAdminPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'update',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `duplicate` if a new document can't be created with the contents of the publish", async () => {
    const documentPair = {
      draft: null,
      published: {_id: 'book-id', _type: 'book', locked: true},
    }

    const getRequiresApprovalPairPermissions = setupTest({
      grants: exampleGrants.requiresApproval,
      liveEdit: true,
      documentPair,
    })

    await expect(
      getRequiresApprovalPairPermissions({
        id: 'book-id',
        permission: 'duplicate',
        type: 'book',
      })
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to duplicate:\n' +
        '\tnot allowed to create new published document from existing document (live-edit): No matching grants found',
    })

    const getAdminPairPermissions = setupTest({
      grants: exampleGrants.administrator,
      liveEdit: false,
      documentPair,
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'duplicate',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })
})
