/**
 * Document pane uses BoundaryElementProvider on the scroll container. Portaled dialogs sit outside
 * that subtree, so the default boundaries break in two ways: `hide` sets referenceHidden (popover
 * hidden), and flip/shift/constrainSize use the wrong rect (popover misplaced). Use the document
 * root as a fallback boundary when the reference element isn't inside a `BoundaryElementProvider`.
 * For the in-pane case, see {@link useReferenceAutocompletePopoverBoundary}.
 *
 * Shared by same-dataset, cross-dataset, and global-document reference autocompletes.
 */
export const AUTOCOMPLETE_POPOVER_BOUNDARY: HTMLElement | undefined =
  typeof document === 'undefined' ? undefined : document.documentElement
