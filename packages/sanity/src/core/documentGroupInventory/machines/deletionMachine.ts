import {type MultipleMutationResult} from '@sanity/client'
import {EMPTY} from 'rxjs'
import {and, assign, fromObservable, fromPromise, not, or, sendParent, setup} from 'xstate'

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
  internalReferences?: InternalReferences
  crossDatasetReferences?: CrossDatasetReferences
  projectIds: string[]
  datasetNames: string[]
  hasUnknownDatasetNames: boolean
  error?: unknown
  incomingReferencesChecked: boolean
  /** Whether this instance may never delete anything. */
  readOnly: boolean
}

type DeletionEvents =
  | {type: 'delete.request'}
  | {type: 'delete.confirm'}
  | {type: 'delete.cancel'}
  | {type: 'selection.changed'; selectedIds: Set<string>}

export const deletionMachine = setup({
  types: {} as {
    context: DeletionContext
    events: DeletionEvents
    input: {readOnly?: boolean} | undefined
    tags: 'awaitingDeletionConfirmation' | 'warnIncomingReferences'
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
  },
  guards: {
    hasSelection: ({context}) => context.ids.length !== 0,
    isMutable: ({context}) => !context.readOnly,
    selectionExcludesPublished: ({context}) => !context.ids.some(isPublishedId),
    hasCheckedIncomingReferences: ({context}) => context.incomingReferencesChecked,
    canRequestDeletion: and(['hasSelection', 'isMutable']),
    canConfirmDeletion: and([
      'hasSelection',
      'isMutable',
      or(['selectionExcludesPublished', 'hasCheckedIncomingReferences']),
    ]),
    shouldWarnIncomingReferences: ({context}) =>
      context.ids.some(isPublishedId) &&
      ((context.internalReferences?.references.length ?? 0) > 0 ||
        (context.crossDatasetReferences?.references.length ?? 0) > 0),
  },
}).createMachine({
  id: 'deletion',
  context: ({input}) => ({
    ids: [],
    internalReferences: undefined,
    crossDatasetReferences: undefined,
    projectIds: [],
    datasetNames: [],
    hasUnknownDatasetNames: false,
    error: undefined,
    incomingReferencesChecked: false,
    readOnly: input?.readOnly ?? false,
  }),
  on: {
    'selection.changed': {
      actions: assign({ids: ({event}) => [...event.selectedIds]}),
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
      entry: [sendParent({type: 'deletion.activated'}), assign({incomingReferencesChecked: false})],
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
                  },
                },
              },
            },
            deleting: {
              invoke: {
                src: 'deleteVariants',
                input: ({context}) => ({ids: context.ids}),
                onDone: {
                  target: '#deletion.idle',
                },
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
