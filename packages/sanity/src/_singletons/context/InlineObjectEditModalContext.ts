import {createContext} from 'sanity/_createContext'

export interface InlineObjectEditModalContextValue {
  active: boolean
  setActive: (active: boolean) => void
}

/**
 * Whether an inline object edit modal is open or has been requested but is not yet
 * reflected in form state. `member.open` alone is not enough: the editor focuses an
 * inline object before that propagates, which would otherwise surface its toolbar.
 *
 * @internal
 */
export const InlineObjectEditModalContext = createContext<InlineObjectEditModalContextValue | null>(
  'sanity/_singletons/context/inline-object-edit-modal',
  null,
)
