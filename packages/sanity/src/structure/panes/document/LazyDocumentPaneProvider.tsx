import {createLazyComponent} from '../../../core/components/lazy/createLazyComponent'
import {type DocumentPaneProviderProps} from './types'

// The provider pulls in the whole document pane (form state, timeline and events stores,
// perspective and release providers), and `sanity/structure` is loaded up front by every studio
// that uses `structureTool()`. Exporting this wrapper keeps that out of the entry's static import
// graph. The structure tool renders its own document panes with the implementation directly.
//
// No boundary of its own: a custom pane suspends to the one `StructureToolPane` has around every
// pane, which shows the pane loading state.
/**
 * @hidden
 * @beta
 */
export const DocumentPaneProvider = createLazyComponent<DocumentPaneProviderProps>(
  () => import('./DocumentPaneProviderWrapper.lazy'),
)
