/**
 * Document pane uses BoundaryElementProvider on the scroll container. Portaled dialogs sit outside
 * that subtree, so the default boundaries break in two ways: `hide` sets referenceHidden (popover
 * hidden), and flip/shift/constrainSize use the wrong rect (popover misplaced). Use the document
 * root for both floating and reference boundaries so placement matches the viewport everywhere.
 *
 * Shared by same-dataset, cross-dataset, and global-document reference autocompletes.
 */
export const AUTOCOMPLETE_POPOVER_BOUNDARY: HTMLElement | undefined =
  typeof document === 'undefined' ? undefined : document.documentElement
