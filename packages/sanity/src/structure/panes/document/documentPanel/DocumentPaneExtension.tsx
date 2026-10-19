import {createContext, type ReactNode, useContext} from 'react'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * Two slots in the document pane: `banners` renders above the pane's own banners (C7), and `pills` REPLACES the
 * stock row of version pills in the pane header (C2), so a design supersedes today's pills instead of adding a second
 * row. Today the panel hard-codes both.
 *
 * It is a hook, so the host can read its own state per document. The default returns `undefined`, so Studio is
 * unchanged unless a provider is mounted.
 *
 * @internal
 */
export interface DocumentPaneExtensionArgs {
  /** The published id of the document group. */
  documentId: string
  documentType: string
}

/** @internal */
export interface DocumentPaneExtension {
  banners?: ReactNode
  pills?: ReactNode
}

/** @internal */
export type UseDocumentPaneExtension = (args: DocumentPaneExtensionArgs) => DocumentPaneExtension | undefined

const noExtension: UseDocumentPaneExtension = () => undefined

const DocumentPaneExtensionContext = createContext<UseDocumentPaneExtension>(noExtension)

/** @internal Provide a hook (a stable function) that extends the document pane. */
export const DocumentPaneExtensionProvider = DocumentPaneExtensionContext.Provider

/** @internal */
export function useDocumentPaneExtension(args: DocumentPaneExtensionArgs): DocumentPaneExtension | undefined {
  // The context value is a stable hook supplied once by the host, so calling it keeps the hook order.
  const useExtension = useContext(DocumentPaneExtensionContext)
  return useExtension(args)
}
