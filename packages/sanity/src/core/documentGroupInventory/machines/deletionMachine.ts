import {type MultipleMutationResult} from '@sanity/client'
import {EMPTY} from 'rxjs'
import {and, assign, emit, fromObservable, fromPromise, not, or, sendParent, setup} from 'xstate'

import {isPublishedId} from '../../util/draftUtils'

/**
 * @internal
 */
export interface IncomingReference {
  _id: string
  _type: string
}

/**
 * @internal
 */
export interface InternalReferences {
  totalCount: number
  references: IncomingReference[]
}

/**
 * @internal
 */
export interface CrossDatasetReference {
  projectId: string
  documentId?: string
  datasetName?: string
}

/**
 * @internal
 */
export interface CrossDatasetReferences {
  totalCount: number
  references: CrossDatasetReference[]
}

/**
 * @internal
 */
export interface ReferringDocuments {
  isLoading: boolean
  totalCount: number
  projectIds: string[]
  datasetNames: string[]
  hasUnknownDatasetNames: boolean
  internalReferences?: InternalReferences
  crossDatasetReferences?: CrossDatasetReferences
}

interface DeletionContext {
  ids: string[]
  /** Every version of the document group, selected or not. */
  versionIds: string[]
  /**
   * The distinct variants the document group has, counted by variant id: a draft and a published
   * copy of the same variant are one variant. While any exist, the published Default can't be
   * deleted.
   */
  variantIds: string[]
  internalReferences?: InternalReferences
  crossDatasetReferences?: CrossDatasetReferences
  projectIds: string[]
  datasetNames: string[]
  hasUnknownDatasetNames: boolean
  error?: unknown
  incomingReferencesChecked: boolean
  /**
   * Set when the user chose to delete the other versions and leave the blocked Default. `ids`
   * keeps the whole selection, so a failed attempt that is retried still sees the Default blocked.
   */
  leavePublished: boolean
  /** The ids the delete in flight removes, fixed when it starts: selection changes meanwhile don't move it. */
  deletingIds: string[]
  /** Whether this instance may never delete anything. */
  readOnly: boolean
}

type DeletionEvents =
  | {type: 'delete.request'}
  | {type: 'delete.confirm'}
  /** Deletes the selected versions except the published document, which variants block. */
  | {type: 'delete.confirmExcludingPublished'}
  | {type: 'delete.cancel'}
  | {type: 'selection.changed'; selectedIds: Set<string>}
  | {type: 'versions.changed'; versionIds: string[]; variantIds: string[]}

export const deletionMachine = setup({
  types: {} as {
    context: DeletionContext
    events: DeletionEvents
    input: {readOnly?: boolean} | undefined
    tags: 'awaitingDeletionConfirmation' | 'warnIncomingReferences'
    emitted: {type: 'allVersionsDeleted'}
  },
  actors: {
    referringDocuments: fromObservable<ReferringDocuments, unknown>(() => {
      throw new Error('`referringDocuments` actor must be provided.')
    }),
    deleteVariants: fromPromise<MultipleMutationResult, {ids: string[]}>(() =>
      Promise.reject(new Error('`deleteVariants` actor must be provided.')),
    ),
  },
  actions: {
    requestDeletionConfirmation: () => {},
    excludePublished: assign({leavePublished: true}),
    /** Tells the inventory's consumer that the delete left the document group with no versions. */
    allVersionsDeleted: emit({type: 'allVersionsDeleted'}),
  },
  guards: {
    hasSelection: ({context}) => context.ids.length !== 0,
    isMutable: ({context}) => !context.readOnly,
    selectionExcludesPublished: ({context}) => !context.ids.some(isPublishedId),
    hasCheckedIncomingReferences: ({context}) => context.incomingReferencesChecked,
    canRequestDeletion: and(['hasSelection', 'isMutable']),
    /** The published Default can't be deleted while the document has variants: they need it. */
    publishedBlocked: ({context}) =>
      context.ids.some(isPublishedId) && context.variantIds.length > 0,
    hasUnpublishedSelection: ({context}) => context.ids.some((id) => !isPublishedId(id)),
    canConfirmDeletion: and([
      'hasSelection',
      'isMutable',
      or(['selectionExcludesPublished', 'hasCheckedIncomingReferences']),
      not('publishedBlocked'),
    ]),
    canConfirmDeletionExcludingPublished: and([
      'isMutable',
      'publishedBlocked',
      'hasUnpublishedSelection',
    ]),
    deletedEveryVersion: ({context}) => {
      const deleted = new Set(context.deletingIds)
      return context.versionIds.length > 0 && context.versionIds.every((id) => deleted.has(id))
    },
    shouldWarnIncomingReferences: ({context}) =>
      context.ids.some(isPublishedId) &&
      ((context.internalReferences?.references.length ?? 0) > 0 ||
        (context.crossDatasetReferences?.references.length ?? 0) > 0),
  },
}).createMachine({
  id: 'deletion',
  context: ({input}) => ({
    ids: [],
    versionIds: [],
    variantIds: [],
    internalReferences: undefined,
    crossDatasetReferences: undefined,
    projectIds: [],
    datasetNames: [],
    hasUnknownDatasetNames: false,
    error: undefined,
    incomingReferencesChecked: false,
    leavePublished: false,
    deletingIds: [],
    readOnly: input?.readOnly ?? false,
  }),
  on: {
    'selection.changed': {
      actions: assign({ids: ({event}) => [...event.selectedIds], leavePublished: false}),
    },
    'versions.changed': {
      actions: assign({
        versionIds: ({event}) => event.versionIds,
        variantIds: ({event}) => event.variantIds,
      }),
    },
  },
  initial: 'idle',
  states: {
    idle: {
      on: {
        'delete.request': {
          guard: 'canRequestDeletion',
          target: 'active',
        },
      },
    },
    active: {
      type: 'parallel',
      // Each flow re-runs the check, so the previous flow's result must not
      // carry over into this one.
      entry: [
        sendParent({type: 'deletion.activated'}),
        assign({incomingReferencesChecked: false, leavePublished: false}),
      ],
      exit: sendParent({type: 'deletion.deactivated'}),
      on: {
        'delete.cancel': {
          target: '#deletion.idle',
        },
      },
      states: {
        deletion: {
          initial: 'preparing',
          states: {
            preparing: {
              type: 'parallel',
              states: {
                checkingIncomingReferences: {
                  initial: 'checking',
                  states: {
                    checking: {
                      invoke: {
                        src: 'referringDocuments',
                        onSnapshot: {
                          guard: ({event}) => event.snapshot.context?.isLoading === false,
                          target: 'checked',
                          actions: assign({
                            internalReferences: ({event}) =>
                              event.snapshot.context?.internalReferences,
                            crossDatasetReferences: ({event}) =>
                              event.snapshot.context?.crossDatasetReferences,
                            projectIds: ({event}) => event.snapshot.context?.projectIds ?? [],
                            datasetNames: ({event}) => event.snapshot.context?.datasetNames ?? [],
                            hasUnknownDatasetNames: ({event}) =>
                              event.snapshot.context?.hasUnknownDatasetNames ?? false,
                            incomingReferencesChecked: true,
                          }),
                        },
                        onError: {
                          target: '#deletion.active.deletion.error',
                          actions: assign({error: ({event}) => event.error}),
                        },
                      },
                    },
                    checked: {},
                  },
                },
                awaitingDeletionConfirmation: {
                  tags: 'awaitingDeletionConfirmation',
                  entry: 'requestDeletionConfirmation',
                  on: {
                    'delete.confirm': {
                      guard: 'canConfirmDeletion',
                      target: '#deletion.active.deletion.deleting',
                    },
                    'delete.confirmExcludingPublished': {
                      guard: 'canConfirmDeletionExcludingPublished',
                      target: '#deletion.active.deletion.deleting',
                      actions: 'excludePublished',
                    },
                  },
                },
              },
            },
            deleting: {
              entry: assign({deletingIds: ({context}) => deletedIds(context)}),
              invoke: {
                src: 'deleteVariants',
                input: ({context}) => ({ids: context.deletingIds}),
                onDone: [
                  {
                    guard: 'deletedEveryVersion',
                    target: '#deletion.idle',
                    actions: 'allVersionsDeleted',
                  },
                  {target: '#deletion.idle'},
                ],
                onError: {
                  target: '#deletion.active.deletion.error',
                  actions: assign({error: ({event}) => event.error}),
                },
              },
            },
            error: {
              on: {
                'delete.confirm': {
                  guard: 'canConfirmDeletion',
                  target: '#deletion.active.deletion.deleting',
                },
                'delete.confirmExcludingPublished': {
                  guard: 'canConfirmDeletionExcludingPublished',
                  target: '#deletion.active.deletion.deleting',
                  actions: 'excludePublished',
                },
              },
            },
          },
        },
        incomingReferenceWarning: {
          initial: 'inactive',
          states: {
            inactive: {
              always: {
                guard: 'shouldWarnIncomingReferences',
                target: 'warnIncomingReferences',
              },
            },
            warnIncomingReferences: {
              tags: 'warnIncomingReferences',
              always: {
                guard: not('shouldWarnIncomingReferences'),
                target: 'inactive',
              },
            },
          },
        },
      },
    },
  },
})

/** The versions a confirmed delete removes: the selection, less the Default when it is left. */
function deletedIds(context: DeletionContext): string[] {
  return context.leavePublished ? context.ids.filter((id) => !isPublishedId(id)) : context.ids
}
