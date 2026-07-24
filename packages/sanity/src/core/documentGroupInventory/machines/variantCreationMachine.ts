import {EMPTY} from 'rxjs'
import {and, assign, fromObservable, fromPromise, not, sendParent, setup, stateIn} from 'xstate'

import {type TargetPerspective} from '../../perspective/types'
import {type ReleasesReducerState} from '../../releases/store/reducer'
import {type SystemBundle} from '../../util/draftUtils'
import {type VariantStoreState} from '../../variants/store/reducer'
import {type SystemVariant} from '../../variants/types'

/**
 * @internal
 */
export type VariantCreationBundle =
  | {type: Extract<SystemBundle, 'drafts'>}
  | {type: 'release'; releaseId: string}

interface VariantCreationContext {
  variants: VariantStoreState | undefined
  releases: ReleasesReducerState | undefined
  selectedVariantId: string | undefined
  selectedBundle: VariantCreationBundle | undefined
  error?: unknown
}

type VariantCreationEvents =
  | {type: 'createVariant.request'}
  | {type: 'createVariant.cancel'}
  | {type: 'createVariant.selectVariant'; variantId: string | undefined}
  | {type: 'createVariant.selectBundle'; bundle: VariantCreationBundle | undefined}
  | {type: 'createVariant.confirm'}

export const variantCreationMachine = setup({
  types: {} as {
    context: VariantCreationContext
    events: VariantCreationEvents
  },
  actors: {
    variants: fromObservable<VariantStoreState, unknown>(() => EMPTY),
    releases: fromObservable<ReleasesReducerState, unknown>(() => EMPTY),
    createVariant: fromPromise<
      void,
      {variantDefinition: SystemVariant; bundle: Exclude<TargetPerspective, 'published'>}
    >(() => Promise.reject(new Error('`createVariant` actor must be provided.'))),
  },
  guards: {
    hasSelectedVariant: ({context}) => typeof context.selectedVariantId !== 'undefined',
    hasSelectedBundle: ({context}) => typeof context.selectedBundle !== 'undefined',
    canConfirmCreation: and(['hasSelectedVariant', 'hasSelectedBundle']),
  },
}).createMachine({
  id: 'variantCreation',
  context: {
    variants: undefined,
    releases: undefined,
    selectedVariantId: undefined,
    selectedBundle: undefined,
    error: undefined,
  },
  invoke: [
    {
      src: 'variants',
      onSnapshot: {
        actions: assign({variants: ({event}) => event.snapshot.context}),
      },
    },
    {
      src: 'releases',
      onSnapshot: {
        actions: assign({releases: ({event}) => event.snapshot.context}),
      },
    },
  ],
  initial: 'idle',
  states: {
    idle: {
      on: {
        'createVariant.request': 'active',
      },
    },
    active: {
      entry: sendParent({type: 'variantCreation.activated'}),
      exit: [
        sendParent({type: 'variantCreation.deactivated'}),
        assign({
          selectedVariantId: undefined,
          selectedBundle: undefined,
          error: undefined,
        }),
      ],
      on: {
        'createVariant.cancel': '#variantCreation.idle',
        'createVariant.selectVariant': {
          guard: not(stateIn('#variantCreation.active.creating')),
          actions: assign({selectedVariantId: ({event}) => event.variantId}),
        },
        'createVariant.selectBundle': {
          guard: not(stateIn('#variantCreation.active.creating')),
          actions: assign({selectedBundle: ({event}) => event.bundle}),
        },
      },
      initial: 'configuring',
      states: {
        configuring: {
          on: {
            'createVariant.confirm': {
              guard: 'canConfirmCreation',
              target: 'creating',
            },
          },
        },
        creating: {
          invoke: {
            src: 'createVariant',
            input: ({context}) => {
              const {selectedVariantId, selectedBundle} = context

              const variantDefinition = context.variants?.variants.get(selectedVariantId ?? '')

              const bundle =
                selectedBundle?.type === 'drafts'
                  ? 'drafts'
                  : context.releases?.releases.get(selectedBundle?.releaseId ?? '')

              if (typeof variantDefinition === 'undefined' || typeof bundle === 'undefined') {
                throw new Error('Cannot create a variant before a variant and bundle are selected.')
              }

              return {
                variantDefinition,
                bundle,
              }
            },
            onDone: {
              target: '#variantCreation.idle',
            },
            onError: {
              target: 'error',
              actions: assign({error: ({event}) => event.error}),
            },
          },
        },
        error: {
          on: {
            'createVariant.confirm': {
              guard: 'canConfirmCreation',
              target: 'creating',
            },
          },
        },
      },
    },
  },
})
