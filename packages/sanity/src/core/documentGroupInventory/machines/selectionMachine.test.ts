import {BehaviorSubject, EMPTY, type Observable, Subject} from 'rxjs'
import {describe, expect, it} from 'vitest'
import {createActor, fromObservable} from 'xstate'

import {selectionMachine, type Variant} from './selectionMachine'

// The available variants are computed by the parent inventory machine and
// relayed down as a `variants.changed` event; name derivation is covered in
// documentGroupInventoryMachine.test.ts.
const DEFAULT_VARIANTS: Variant[] = [
  {id: 'drafts.foo', name: 'Draft'},
  {id: 'foo', name: 'Published'},
]

function createSelectionActor({
  variants = DEFAULT_VARIANTS,
  filter$,
}: {
  // Pass `null` to keep the machine in `loading` and drive variants manually.
  variants?: Variant[] | null
  filter$?: Observable<string>
} = {}) {
  const actor = createActor(
    selectionMachine.provide({
      actors: {
        filterString: fromObservable(() => filter$ ?? EMPTY),
      },
      // In isolation there is no parent to notify; parent coordination is
      // covered in documentGroupInventoryMachine.test.ts.
      actions: {notifySelectionChanged: () => {}},
    }),
  )
  actor.start()
  if (variants) {
    actor.send({type: 'variants.changed', variants, loaded: true})
  }
  return actor
}

describe('selectionMachine', () => {
  it('transitions from loading to ready once the variants have loaded', () => {
    const selection = createSelectionActor({variants: null})

    expect(selection.getSnapshot().matches('loading')).toBe(true)

    selection.send({type: 'variants.changed', variants: DEFAULT_VARIANTS, loaded: true})
    expect(selection.getSnapshot().matches('ready')).toBe(true)
  })

  it('stores incoming variants without leaving loading until they are loaded', () => {
    const selection = createSelectionActor({variants: null})

    selection.send({type: 'variants.changed', variants: DEFAULT_VARIANTS, loaded: false})

    expect(selection.getSnapshot().matches('loading')).toBe(true)
    expect(selection.getSnapshot().context.variants).toEqual(DEFAULT_VARIANTS)
  })

  it('reflects the provided filter string into context as it emits', () => {
    const filter$ = new BehaviorSubject<string>('')
    const selection = createSelectionActor({filter$})

    expect(selection.getSnapshot().context.filterString).toBe('')

    filter$.next('hello')
    expect(selection.getSnapshot().context.filterString).toBe('hello')

    filter$.next('world')
    expect(selection.getSnapshot().context.filterString).toBe('world')
  })

  it('enters the error state and clears data when meta reports an error', () => {
    const selection = createSelectionActor()

    expect(selection.getSnapshot().matches('ready')).toBe(true)
    expect(selection.getSnapshot().context.variants).not.toEqual([])

    selection.send({type: 'meta.error', error: new Error('meta failed')})
    expect(selection.getSnapshot().matches('error')).toBe(true)
    expect(selection.getSnapshot().context.variants).toEqual([])
  })

  it('enters the error state from loading when meta errors', () => {
    const selection = createSelectionActor({variants: null})

    selection.send({type: 'meta.error', error: new Error('observable failed')})
    expect(selection.getSnapshot().matches('error')).toBe(true)
  })

  it('toggles selection on and off', () => {
    const selection = createSelectionActor()

    selection.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    expect([...selection.getSnapshot().context.selectedIds]).toEqual(['drafts.foo'])

    selection.send({type: 'selection.toggle', variantId: 'drafts.foo'})
    expect([...selection.getSnapshot().context.selectedIds]).toEqual([])
  })

  it('adds and removes individual variants', () => {
    const selection = createSelectionActor()

    selection.send({type: 'selection.add', variantId: 'drafts.foo'})
    selection.send({type: 'selection.add', variantId: 'foo'})
    // Adding an existing id is a no-op.
    selection.send({type: 'selection.add', variantId: 'foo'})
    expect([...selection.getSnapshot().context.selectedIds]).toEqual(['drafts.foo', 'foo'])

    selection.send({type: 'selection.remove', variantId: 'drafts.foo'})
    expect([...selection.getSnapshot().context.selectedIds]).toEqual(['foo'])
  })

  it('clears the entire selection', () => {
    const selection = createSelectionActor()

    selection.send({type: 'selection.add', variantId: 'drafts.foo'})
    selection.send({type: 'selection.add', variantId: 'foo'})
    selection.send({type: 'selection.clear'})

    expect([...selection.getSnapshot().context.selectedIds]).toEqual([])
  })

  it('ignores selection changes while locked and resumes once unlocked', () => {
    const selection = createSelectionActor()

    selection.send({type: 'selection.add', variantId: 'drafts.foo'})
    selection.send({type: 'selection.lock'})
    expect(selection.getSnapshot().matches('readonly')).toBe(true)

    // Selection mutations are dropped while locked.
    selection.send({type: 'selection.add', variantId: 'foo'})
    selection.send({type: 'selection.clear'})
    expect([...selection.getSnapshot().context.selectedIds]).toEqual(['drafts.foo'])

    selection.send({type: 'selection.unlock'})
    expect(selection.getSnapshot().matches('ready')).toBe(true)
    selection.send({type: 'selection.add', variantId: 'foo'})
    expect([...selection.getSnapshot().context.selectedIds]).toEqual(['drafts.foo', 'foo'])
  })

  it('prunes selected ids that disappear from the available variants', () => {
    const selection = createSelectionActor()

    selection.send({type: 'selection.add', variantId: 'drafts.foo'})
    selection.send({type: 'selection.add', variantId: 'foo'})
    expect([...selection.getSnapshot().context.selectedIds]).toEqual(['drafts.foo', 'foo'])

    // The published variant is no longer available, so it is pruned.
    selection.send({
      type: 'variants.changed',
      variants: [{id: 'drafts.foo', name: 'Draft'}],
      loaded: true,
    })
    expect([...selection.getSnapshot().context.selectedIds]).toEqual(['drafts.foo'])
    expect(selection.getSnapshot().context.variants).toEqual([{id: 'drafts.foo', name: 'Draft'}])
  })

  it('computes case-insensitive filter matches', () => {
    const selection = createSelectionActor()

    // Names are "Draft" and "Published"; matching ignores case on both sides.
    selection.send({type: 'filterString.set', value: 'DRAFT'})
    expect([...selection.getSnapshot().context.filterMatchingVariantIds]).toEqual(['drafts.foo'])

    selection.send({type: 'filterString.set', value: 'pub'})
    expect([...selection.getSnapshot().context.filterMatchingVariantIds]).toEqual(['foo'])
  })

  it('clears filter matches when the filter string becomes undefined', () => {
    const filter$ = new Subject<string | undefined>()
    const selection = createSelectionActor({filter$: filter$ as unknown as Observable<string>})

    filter$.next('draft')
    expect([...selection.getSnapshot().context.filterMatchingVariantIds]).toEqual(['drafts.foo'])

    filter$.next(undefined)
    expect(selection.getSnapshot().context.filterString).toBeUndefined()
    expect([...selection.getSnapshot().context.filterMatchingVariantIds]).toEqual([])
  })
})
