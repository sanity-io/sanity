import {createLazyComponent} from '../components/lazy/createLazyComponent'
import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {type DialogProps, type PopoverProps} from './components/EditPortal'
import {type EnhancedObjectDialogProps} from './components/EnhancedObjectDialog'
import {type PortableTextInputProps} from './types/inputProps'

// Code-split facades for the form components that the root `sanity` entry exports. They live apart
// from the internal facades in `./lazy`, which only the internals entries export: whatever this
// module holds is part of every studio's first load, so keep it to the public components. The
// implementations load from the same `./publicComponents.lazy` chunk as the internal facades.

/**
 * The default Portable Text input. Loads the editor on first render.
 *
 * @public
 */
export const PortableTextInput = createLazyComponent<PortableTextInputProps>(
  () => import('./publicComponents.lazy').then((module) => ({default: module.PortableTextInput})),
  {fallback: <LoadingBlock />},
)

/**
 * Creates a dialog or a popover for editing content.
 * Handles presence and virtual scrolling.
 *
 * When multiple dialogs are open, only the top-most dialog is visible.
 * Non-top dialogs are hidden via CSS while preserving their state.
 *
 * @beta
 */
export const EnhancedObjectDialog = createLazyComponent<EnhancedObjectDialogProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.EnhancedObjectDialog})),
)

/**
 * @beta
 * Creates a dialog or a popover for editing content.
 * Handles presence and virtual scrolling.
 */
export const EditPortal = createLazyComponent<PopoverProps | DialogProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.EditPortal})),
)
