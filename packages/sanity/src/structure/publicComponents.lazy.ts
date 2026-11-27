// Lazy entry for the structure components that `sanity/structure` exports through the facades in
// `./publicLazy`. They render a document's form, which every studio would otherwise load before
// the login screen, since `sanity/structure` is part of its first load.
export {ConfirmDeleteDialog} from './components/confirmDeleteDialog'
export {DocumentPane} from './panes/document/DocumentPane'
export {PaneContainer as DocumentListPane} from './panes/documentList/PaneContainer'
export {DocumentPaneProviderWrapper as DocumentPaneProvider} from './panes/document/DocumentPaneProviderWrapper'
