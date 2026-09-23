import {createContext} from 'sanity/_createContext'

export interface InlineObjectEditModalContextValue {
  /** An inline object edit modal is open, or is opening and not yet reflected in form state. */
  active: boolean
  /** Marks a modal as opening. Cleared once `member.open` propagates, or on item close. */
  setOpening: (opening: boolean) => void
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
