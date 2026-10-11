import {createContext} from 'sanity/_createContext'

/** @internal */
export interface EditDialogOuterBoundaryContextValue {
  element: HTMLElement | null
}

/**
 * @internal
 * @deprecated No longer provided or read by the studio. Popovers that may escape a dialog
 * (array insert menu, reference autocomplete results) now use the boundary declared by the hosting
 * surface through `PortalBoundaryContext` / `PortalBoundaryProvider`. Kept exported so the
 * `sanity/_singletons` surface does not break; will be removed in the next major.
 */
export const EditDialogOuterBoundaryContext =
  createContext<EditDialogOuterBoundaryContextValue | null>(
    'sanity/_singletons/context/edit-dialog-outer-boundary',
    null,
  )
