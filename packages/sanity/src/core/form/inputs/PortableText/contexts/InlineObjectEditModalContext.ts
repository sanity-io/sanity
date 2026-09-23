import {useContext} from 'react'
import {
  InlineObjectEditModalContext,
  type InlineObjectEditModalContextValue,
} from 'sanity/_singletons'

// The toolbar renders outside a Compositor in Storybook stories and in standalone
// editor chrome, where there is no inline object edit modal to track.
const INERT_INLINE_OBJECT_EDIT_MODAL: InlineObjectEditModalContextValue = {
  active: false,
  setOpening: () => {},
}

export function useInlineObjectEditModal(): InlineObjectEditModalContextValue {
  return useContext(InlineObjectEditModalContext) ?? INERT_INLINE_OBJECT_EDIT_MODAL
}
