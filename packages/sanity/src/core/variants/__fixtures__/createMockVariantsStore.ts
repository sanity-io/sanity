import {BehaviorSubject} from 'rxjs'

import {type VariantStore} from '../store/createVariantsStore'
import {type VariantStoreState} from '../store/reducer'
import {type EditableSystemVariant, type SystemVariant} from '../types'

/**
 * A loaded variants store whose definitions the test controls: `list` adds a definition the way the
 * real store does once the global listener reports it.
 *
 * @internal
 */
export function createMockVariantsStore(variants: SystemVariant[] = []): {
  list: (variant: EditableSystemVariant) => void
  store: VariantStore
} {
  const state$ = new BehaviorSubject<VariantStoreState>({
    state: 'loaded',
    variants: new Map(variants.map((variant) => [variant._id, variant])),
  })

  function list(variant: EditableSystemVariant) {
    const current = state$.getValue()
    const listed: SystemVariant = {
      ...variant,
      _createdAt: '2025-06-01T00:00:00Z',
      _updatedAt: '2025-06-01T00:00:00Z',
      _rev: `rev-${variant._id}`,
    }
    state$.next({...current, variants: new Map(current.variants).set(variant._id, listed)})
  }

  return {
    list,
    store: {state$, initialState: state$.getValue(), dispatch: () => undefined},
  }
}
