import {type ReleaseDocument} from '@sanity/client'
import {EMPTY} from 'rxjs'
import {assign, forwardTo, fromObservable, sendTo, setup, type ActorRefFromLogic} from 'xstate'

import {type TFunction} from '../../i18n/types'
import {type DocumentPerspectiveState} from '../../releases/hooks/useDocumentVersions'
import {type ReleasesReducerState} from '../../releases/store/reducer'
import {type AgentBundlesState} from '../../store/agent/createAgentBundlesStore'
import {type VariantStoreState} from '../../variants/store/reducer'
import {computeSets} from '../utils/computeSets'
import {type deletionMachine} from './deletionMachine'
import {type selectionMachine, type Variant} from './selectionMachine'

type SelectionLogic = typeof selectionMachine
type DeletionLogic = typeof deletionMachine

export interface Meta {
  versionState: DocumentPerspectiveState
  releases: ReleasesReducerState
  variants: VariantStoreState
  agentBundles: AgentBundlesState
}

export interface VariantSet {
  key: string
  name: string
  variants: Variant[]
}

interface DocumentGroupInventoryContext {
  selectionRef: ActorRefFromLogic<SelectionLogic>
  deletionRef: ActorRefFromLogic<DeletionLogic>
  sets: VariantSet[]
  releases: Map<string, ReleaseDocument>
  t: TFunction
  variantsEnabled: boolean | undefined
}

type DocumentGroupInventoryEvents =
  | {type: 'selection.changed'; selectedIds: Set<string>}
  | {type: 'deletion.activated'}
  | {type: 'deletion.deactivated'}
  | {type: 'feedback.begin'}
  | {type: 'feedback.end'}

export const documentGroupInventoryMachine = setup({
  types: {} as {
    input: {
      selectionMachine: SelectionLogic
      deletionMachine: DeletionLogic
      t: TFunction
      variantsEnabled: boolean | undefined
    }
    context: DocumentGroupInventoryContext
    events: DocumentGroupInventoryEvents
  },
  actors: {
    meta: fromObservable<Meta, unknown>(() => EMPTY),
  },
  actions: {
    onFeedbackBegin: () => {},
  },
}).createMachine({
  id: 'documentGroupInventory',
  context: ({input, spawn}) => ({
    selectionRef: spawn(input.selectionMachine, {
      systemId: 'selection',
      input: undefined,
    }),
    deletionRef: spawn(input.deletionMachine, {
      systemId: 'deletion',
      input: undefined,
    }),
    sets: [],
    releases: new Map(),
    t: input.t,
    variantsEnabled: input.variantsEnabled,
  }),
  invoke: {
    src: 'meta',
    onSnapshot: {
      actions: [
        assign({
          sets: ({context, event}) =>
            computeSets({
              meta: event.snapshot.context,
              current: context.sets,
              t: context.t,
              variantsEnabled: context.variantsEnabled,
            }),
          releases: ({event}) => event.snapshot.context?.releases.releases ?? new Map(),
        }),
        sendTo(
          ({context}) => context.selectionRef,
          ({context, event}) => {
            const meta = event.snapshot.context

            if (metaHasError(meta)) {
              return {type: 'meta.error'} as const
            }

            return {
              type: 'variants.changed',
              variants: context.sets.flatMap((set) => set.variants),
              loaded: metaIsLoaded(meta),
            } as const
          },
        ),
      ],
    },
    onError: {
      actions: sendTo(
        ({context}) => context.selectionRef,
        ({event}) => ({type: 'meta.error', error: event.error}),
      ),
    },
  },
  on: {
    'selection.changed': {
      actions: forwardTo(({context}) => context.deletionRef),
    },
    'deletion.activated': {
      actions: sendTo(({context}) => context.selectionRef, {type: 'selection.lock'}),
    },
    'deletion.deactivated': {
      actions: sendTo(({context}) => context.selectionRef, {type: 'selection.unlock'}),
    },
    'feedback.begin': '.feedback',
    'feedback.end': '.idle',
  },
  initial: 'idle',
  states: {
    idle: {},
    feedback: {
      entry: 'onFeedbackBegin',
    },
  },
})

function metaHasError(meta: Meta | undefined): boolean {
  if (!meta) {
    return false
  }

  return Boolean(meta.versionState.error) || meta.releases.state === 'error'
}

function metaIsLoaded(meta: Meta | undefined): boolean {
  return meta?.versionState.loading === false && meta.releases.state === 'loaded'
}
