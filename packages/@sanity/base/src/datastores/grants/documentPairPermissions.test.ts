import {first} from 'rxjs/operators'
import {Grant} from './types'
import * as exampleGrants from './debug/exampleGrants'

interface TestOptions {
  mockLiveEdit: boolean
  mockDocumentPair: {draft: unknown; published: unknown}
  mockGrants: Grant[]
}

function setupTest({mockDocumentPair, mockGrants, mockLiveEdit}: TestOptions) {
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
      request: jest.fn(() => Promise.resolve(mockGrants)),
    }

    return mockClient
  })

  jest.mock('../user', () => ({
    getCurrentUser: () => Promise.resolve({id: 'example-user-id'}),
  }))

  jest.mock('part:@sanity/base/schema', () => {
    return {get: () => ({mockLiveEdit})}
  })

  jest.mock('../document/document-pair/snapshotPair', () => {
    const {of} = require('rxjs')
    return {
      snapshotPair: jest.fn(() =>
        of({
          draft: {snapshots$: of(null, mockDocumentPair.draft)},
          published: {snapshots$: of(null, mockDocumentPair.published)},
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
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: false,
      mockDocumentPair: {
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
      mockGrants: exampleGrants.viewer,
      mockLiveEdit: false,
      mockDocumentPair: {
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
    const getContributorPairPermissions = setupTest({
      mockGrants: exampleGrants.contributor,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book'},
        published: {_id: 'book-id', _type: 'book'},
      },
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
  })

  it('allows `delete` if both the published and draft can be deleted', async () => {
    const getAdminPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book'},
        published: {_id: 'book-id', _type: 'book'},
      },
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
    const getContributorPairPermissions = setupTest({
      mockGrants: exampleGrants.viewer,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book'},
        published: {_id: 'book-id', _type: 'book'},
      },
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
  })

  it('allows `discardDraft` if the draft can be deleted', async () => {
    const getAdminPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book'},
        published: {_id: 'book-id', _type: 'book'},
      },
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
    const getRequiresApprovalPairPermissions = setupTest({
      mockGrants: exampleGrants.requiresApproval,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book', locked: false},
        published: {_id: 'book-id', _type: 'book', locked: true},
      },
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
  })

  it('allows `publish` if the draft can be deleted and the published can be created from the draft', async () => {
    const getAdminPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book', locked: false},
        published: {_id: 'book-id', _type: 'book', locked: true},
      },
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
    const getRequiresApprovalPairPermissions = setupTest({
      mockGrants: exampleGrants.requiresApproval,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book', locked: true},
        published: {_id: 'book-id', _type: 'book', locked: false},
      },
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
  })

  it('allows `unpublish` if the published can be deleted or if a draft can be created from the published', async () => {
    const getAdminPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book', locked: true},
        published: {_id: 'book-id', _type: 'book', locked: false},
      },
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
    const getRequiresApprovalPairPermissions = setupTest({
      mockGrants: exampleGrants.requiresApproval,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book', locked: true},
        published: {_id: 'book-id', _type: 'book', locked: false},
      },
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
  })

  it('allows `update` if the draft can be updated', async () => {
    const getAdminPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book', locked: true},
        published: {_id: 'book-id', _type: 'book', locked: false},
      },
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
    const getRequiresApprovalPairPermissions = setupTest({
      mockGrants: exampleGrants.requiresApproval,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book', locked: true},
        published: {_id: 'book-id', _type: 'book', locked: false},
      },
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
        '\tnot allowed to create new draft document from existing draft document: No matching grants found',
    })
  })

  it('allows `duplicate` if a new document can be created with the contents of the draft', async () => {
    const getAdminPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: false,
      mockDocumentPair: {
        draft: {_id: 'drafts.book-id', _type: 'book', locked: true},
        published: {_id: 'book-id', _type: 'book', locked: false},
      },
    })

    await expect(
      getAdminPairPermissions({
        id: 'book-id',
        permission: 'duplicate',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `duplicate` if a new document can't be created with the contents of the published document", async () => {
    const getRequiresApprovalPairPermissions = setupTest({
      mockGrants: exampleGrants.requiresApproval,
      mockLiveEdit: false,
      // this is the case right after a publish where there is no draft version
      mockDocumentPair: {
        draft: null,
        published: {_id: 'book-id', _type: 'book', locked: true},
      },
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
        '\tnot allowed to create new draft document from existing published document: No matching grants found',
    })
  })

  it('allows `duplicate` if a new document can be created with the contents of the published document', async () => {
    const getAdminPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: false,
      // this is the case right after a publish where there is no draft version
      mockDocumentPair: {
        draft: null,
        published: {_id: 'book-id', _type: 'book', locked: true},
      },
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
  it('returns granted for non-applicable operations except publish and unpublish', async () => {
    const getDocumentPairPermissions = setupTest({
      mockGrants: exampleGrants.viewer,
      mockLiveEdit: true,
      mockDocumentPair: {
        draft: null,
        published: {_id: 'book-id', _type: 'book'},
      },
    })

    await expect(
      getDocumentPairPermissions({id: 'book-id', permission: 'discardDraft', type: 'book'})
    ).resolves.toEqual({granted: true, reason: ''})
    await expect(
      getDocumentPairPermissions({id: 'book-id', permission: 'publish', type: 'book'})
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to publish:\n' +
        '\tnot allowed to update published document at its current state: No matching grants found',
    })
    await expect(
      getDocumentPairPermissions({id: 'book-id', permission: 'unpublish', type: 'book'})
    ).resolves.toEqual({
      granted: false,
      reason:
        'Unable to unpublish:\n' +
        '\tnot allowed to delete published document: No matching grants found\n' +
        '\tnot allowed to create draft document from published version: No matching grants found',
    })
  })

  it("disallows `delete` if the published can't be deleted", async () => {
    const getContributorPairPermissions = setupTest({
      mockGrants: exampleGrants.contributor,
      mockLiveEdit: true,
      mockDocumentPair: {
        draft: null,
        published: {_id: 'book-id', _type: 'book'},
      },
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
  })

  it('allows `delete` if the published can be deleted', async () => {
    const getContributorPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: true,
      mockDocumentPair: {
        draft: null,
        published: {_id: 'book-id', _type: 'book'},
      },
    })

    await expect(
      getContributorPairPermissions({
        id: 'book-id',
        permission: 'delete',
        type: 'book',
      })
    ).resolves.toEqual({granted: true, reason: ''})
  })

  it("disallows `update` if the published can't be updated", async () => {
    const getRequiresApprovalPairPermissions = setupTest({
      mockGrants: exampleGrants.requiresApproval,
      mockLiveEdit: true,
      mockDocumentPair: {
        draft: null,
        published: {_id: 'book-id', _type: 'book', locked: true},
      },
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
        'Unable to update:\n\tnot allowed to update published document: No matching grants found',
    })
  })

  it('allows `update` if the published can be updated', async () => {
    const getAdminPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: true,
      mockDocumentPair: {
        draft: null,
        published: {_id: 'book-id', _type: 'book'},
      },
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
    const getRequiresApprovalPairPermissions = setupTest({
      mockGrants: exampleGrants.requiresApproval,
      mockLiveEdit: true,
      mockDocumentPair: {
        draft: null,
        published: {_id: 'book-id', _type: 'book', locked: true},
      },
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
        '\tnot allowed to create new draft document from existing published document: No matching grants found',
    })
  })

  it('allows `duplicate` if a new document can be created with the contents of the published', async () => {
    const getAdminPairPermissions = setupTest({
      mockGrants: exampleGrants.administrator,
      mockLiveEdit: true,
      mockDocumentPair: {
        draft: null,
        published: {_id: 'book-id', _type: 'book', locked: true},
      },
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
