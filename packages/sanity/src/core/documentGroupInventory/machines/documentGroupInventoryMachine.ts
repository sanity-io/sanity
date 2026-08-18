import {type ReleaseDocument} from '@sanity/client'
import {EMPTY} from 'rxjs'
import {
  assign,
  forwardTo,
  fromObservable,
  sendTo,
  setup,
  stateIn,
  type ActorRefFromLogic,
} from 'xstate'

import {type TFunction} from '../../i18n/types'
import {type DocumentPerspectiveState} from '../../releases/hooks/useDocumentVersions'
import {type ReleasesReducerState} from '../../releases/store/reducer'
import {type AgentBundlesState} from '../../store/agent/createAgentBundlesStore'
import {type VariantStoreState} from '../../variants/store/reducer'
import {computeSets} from '../utils/computeSets'
import {type deletionMachine} from './deletionMachine'
import {type selectionMachine, type Variant} from './selectionMachine'
import {type variantCreationMachine} from './variantCreationMachine'

type SelectionLogic = typeof selectionMachine
type DeletionLogic = typeof deletionMachine
type VariantCreationLogic = typeof variantCreationMachine

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
  variantCreationRef: ActorRefFromLogic<VariantCreationLogic>
  sets: VariantSet[]
  releases: Map<string, ReleaseDocument>
  t: TFunction
  variantsEnabled: boolean | undefined
  metaState: 'pending' | 'ready'
}

type DocumentGroupInventoryEvents =
  | {type: 'selection.changed'; selectedIds: Set<string>}
  | {type: 'deletion.activated'}
  | {type: 'deletion.deactivated'}
  | {type: 'variantCreation.activated'}
  | {type: 'variantCreation.deactivated'}
  | {type: 'feedback.begin'}
  | {type: 'feedback.end'}

export const documentGroupInventoryMachine = setup({
  types: {} as {
    input: {
      selectionMachine: SelectionLogic
      deletionMachine: DeletionLogic
      variantCreationMachine: VariantCreationLogic
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
  guards: {
    isCreatingVariant: stateIn('creatingVariant'),
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
    variantCreationRef: spawn(input.variantCreationMachine, {
      systemId: 'variantCreation',
      input: undefined,
    }),
    sets: [],
    releases: new Map(),
    t: input.t,
    variantsEnabled: input.variantsEnabled,
    metaState: 'pending' as const,
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
          metaState: ({context, event}) =>
            context.metaState === 'ready' || metaIsSettled(event.snapshot.context)
              ? 'ready'
              : 'pending',
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
              loaded: metaIsSettled(meta),
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
    'variantCreation.activated': '.creatingVariant',
    'variantCreation.deactivated': {
      guard: 'isCreatingVariant',
      target: '.idle',
    },
    'feedback.begin': '.feedback',
    'feedback.end': '.idle',
  },
  initial: 'idle',
  states: {
    idle: {},
    creatingVariant: {},
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

function metaIsSettled(meta: Meta | undefined): boolean {
  if (!meta) {
    return false
  }

  return (
    !meta.versionState.loading &&
    meta.releases.state !== 'initialising' &&
    meta.releases.state !== 'loading' &&
    meta.variants.state !== 'initialising' &&
    meta.variants.state !== 'loading' &&
    !meta.agentBundles.loading
  )
}
