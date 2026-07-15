import {createContext} from 'sanity/_createContext'

import type {EditDialogOuterBoundaryContextValue} from '../../core/form/components/EditDialogOuterBoundaryProvider'

/**
 * The Floating UI boundary that was ambient *outside* the containing edit dialog / modal
 * (`EditPortal`, `EnhancedObjectDialog` and the Portable Text object edit modals) — typically the
 * document pane's scroll container.
 *
 * Edit dialogs constrain descendant popovers to their own scroll container through a generic
 * `BoundaryElementProvider` (see #12721). Popovers that should be allowed to overflow the dialog
 * (currently only the array insert menu) can read this context to constrain themselves to the
 * boundary the dialog itself sits in, instead of the dialog. `null` means "not inside an edit
 * dialog".
 *
 * @internal
 */
export const EditDialogOuterBoundaryContext =
  createContext<EditDialogOuterBoundaryContextValue | null>(
    'sanity/_singletons/context/edit-dialog-outer-boundary',
    null,
  )
