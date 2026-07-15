import {createContext} from 'sanity/_createContext'

/**
 * The content/scroll element of the nearest edit dialog or modal (`EditPortal`,
 * `EnhancedObjectDialog` and the Portable Text object edit modals).
 *
 * Used as an explicit Floating UI boundary by popovers that should be contained within the
 * dialog (e.g. the reference autocomplete). Kept separate from `BoundaryElementProvider` so that
 * dialogs don't constrain every descendant popover — e.g. the array insert menu is allowed to
 * overflow the dialog and remains constrained by the ambient boundary (typically the document
 * pane's scroll container).
 *
 * @internal
 */
export const EditDialogBoundaryContext = createContext<HTMLElement | null>(
  'sanity/_singletons/context/edit-dialog-boundary',
  null,
)
