import {EMPTY} from 'rxjs'
import {and, assign, fromObservable, sendParent, setup, stateIn} from 'xstate'

export interface Variant {
  id: string
  name: string
}

interface SelectionContext {
  selectedIds: Set<string>
  variants: Variant[]
  filterString: string | undefined
  filterMatchingVariantIds: Set<string>
}

type SelectionEvents =
  | {type: 'selection.toggle'; variantId: string}
  | {type: 'selection.add'; variantId: string}
  | {type: 'selection.remove'; variantId: string}
  | {type: 'selection.clear'}
  | {type: 'selection.lock'}
  | {type: 'selection.unlock'}
  | {type: 'variants.changed'; variants: Variant[]; loaded: boolean}
  | {type: 'meta.error'; error?: unknown}
  | {type: 'filterString.set'; value: string}

export const selectionMachine = setup({
  // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
  types: {} as {
    context: SelectionContext
    events: SelectionEvents
  },
  actors: {
    filterString: fromObservable<string, unknown>(() => EMPTY),
  },
  guards: {
    hasSelection: ({context}) => context.selectedIds.size !== 0,
  },
  actions: {
    notifySelectionChanged: sendParent(({context}) => ({
      type: 'selection.changed',
      selectedIds: context.selectedIds,
    })),
    applyVariants: assign(({context, event}) => {
      if (event.type !== 'variants.changed') return {}
      return {
        variants: event.variants,
        selectedIds: pruneSelectedIds(context.selectedIds, event.variants),
      }
    }),
    filterStringChanged: assign({
      filterMatchingVariantIds: ({context}) => {
        if (typeof context.filterString === 'undefined') {
          return new Set()
        }

        const needle = context.filterString.toLowerCase()

        return new Set(
          context.variants
            .filter((variant) => variant.name.toLowerCase().includes(needle))
            .map(({id}) => id),
        )
      },
    }),
  },
}).createMachine({
  id: 'selection',
  context: {
    selectedIds: new Set(),
    variants: [],
    filterString: '',
    filterMatchingVariantIds: new Set(),
  },
  invoke: {
    src: 'filterString',
    onSnapshot: {
      actions: [
        assign({
          filterString: ({event}) => event.snapshot.context,
        }),
        'filterStringChanged',
      ],
    },
  },
  on: {
    'variants.changed': [
      {
        guard: and([stateIn('loading'), ({event}) => event.loaded]),
        target: '.ready',
        actions: ['applyVariants', 'notifySelectionChanged'],
      },
      {
        actions: ['applyVariants', 'notifySelectionChanged'],
      },
    ],
    'meta.error': {
      target: '.error',
      actions: assign({variants: []}),
    },
  },
  initial: 'loading',
  states: {
    loading: {},
    ready: {
      on: {
        'selection.toggle': {
          actions: [
            assign({
              selectedIds: ({context, event}) => {
                const next = new Set(context.selectedIds)
                // oxlint-disable-next-line no-unused-expressions
                next.delete(event.variantId) || next.add(event.variantId)
                return next
              },
            }),
            'notifySelectionChanged',
          ],
        },
        'selection.add': {
          actions: [
            assign({
              selectedIds: ({context, event}) => {
                const next = new Set(context.selectedIds)
                next.add(event.variantId)
                return next
              },
            }),
            'notifySelectionChanged',
          ],
        },
        'selection.remove': {
          actions: [
            assign({
              selectedIds: ({context, event}) => {
                const next = new Set(context.selectedIds)
                next.delete(event.variantId)
                return next
              },
            }),
            'notifySelectionChanged',
          ],
        },
        'selection.clear': {
          actions: [assign({selectedIds: () => new Set<string>()}), 'notifySelectionChanged'],
        },
        'filterString.set': {
          actions: [
            assign({
              filterString: ({event}) => event.value,
            }),
            'filterStringChanged',
          ],
        },
        'selection.lock': 'readonly',
      },
    },
    readonly: {
      on: {
        'selection.unlock': 'ready',
      },
    },
    error: {},
  },
})

function pruneSelectedIds(selectedIds: Set<string>, variants: Variant[]): Set<string> {
  const availableIds = new Set(variants.map((variant) => variant.id))
  return new Set([...selectedIds].filter((id) => availableIds.has(id)))
}
