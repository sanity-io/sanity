import {createLazyComponent} from '../core/components/lazy/createLazyComponent'
import {type ConfirmDeleteDialogProps} from './components/confirmDeleteDialog/ConfirmDeleteDialog'
import {type DocumentPaneProviderProps} from './panes/document/types'
import {type BaseStructureToolPaneProps} from './panes/types'

// Code-split facades for the structure components that `sanity/structure` exports and that render
// a document's form. The implementations load from `./publicComponents.lazy` on first render.

/**
 * @hidden
 * @beta
 */
export const ConfirmDeleteDialog = createLazyComponent<ConfirmDeleteDialogProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.ConfirmDeleteDialog})),
)

/**
 * @hidden
 * @beta
 */
export const DocumentPane = createLazyComponent<DocumentPaneProviderProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.DocumentPane})),
)

/**
 * @hidden
 * @beta
 */
export const DocumentListPane = createLazyComponent<BaseStructureToolPaneProps<'documentList'>>(
  () => import('./publicComponents.lazy').then((module) => ({default: module.DocumentListPane})),
)

/**
 * @hidden
 * @beta
 */
export const DocumentPaneProvider = createLazyComponent<DocumentPaneProviderProps>(() =>
  import('./publicComponents.lazy').then((module) => ({default: module.DocumentPaneProvider})),
)
