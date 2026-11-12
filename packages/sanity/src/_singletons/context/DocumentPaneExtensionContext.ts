import {createContext} from 'react'

/** @internal The host's hook that extends the document pane (see `DocumentPaneExtension`); the default returns nothing. */
export const DocumentPaneExtensionContext = createContext<
  (args: {documentId: string; documentType: string}) => unknown
>(() => undefined)

/**
 * PROPOSED (open beta header). `true` while a host's tab row is drawn at the top of the inspector panel, so an inspector drops its own header.
 * @internal
 */
export const DocumentInspectorTabsContext = createContext<boolean>(false)
