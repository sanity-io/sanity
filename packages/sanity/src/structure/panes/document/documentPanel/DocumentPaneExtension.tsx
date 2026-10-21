import {type ReactNode, useContext} from 'react'
import {DocumentInspectorTabsContext, DocumentPaneExtensionContext} from 'sanity/_singletons'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * Two slots in the document pane: `banners` renders above the pane's own banners (C7), and `pills` REPLACES the
 * stock row of version pills in the pane header (C2), so a design supersedes today's pills instead of adding a second
 * row. Today the panel hard-codes both.
 *
 * It is a function the host builds from its own state (a value in context, not a hook), called per document. The default
 * returns `undefined`, so Studio is unchanged unless a provider is mounted.
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
  /**
   * PROPOSED (open beta header): the compact header. 45 px with a border above and below, no title row in the form column (the form names the
   * document), and a command-only "..." menu (Compare versions, Inspect | Copy and Paste document | Create new task, Share). The inspector
   * entries, Share and Inline changes leave the header: the first become tabs (`inspectorTabs`), Share moves into the menu.
   */
  compactHeader?: boolean
  /**
   * PROPOSED (open beta header): a tab row drawn at the top of the inspector panel. While it is set the inspectors drop their own headers
   * (title and close) and the changes inspector drops its nested History / Review tabs: the row carries them.
   */
  inspectorTabs?: ReactNode
  /**
   * PROPOSED (open beta header): controls drawn in the compact header's right-hand group, just before the "..." menu (for example the panels as icon
   * buttons). Only drawn with `compactHeader`.
   */
  headerPanels?: ReactNode
}

/** @internal */
export type ResolveDocumentPaneExtension = (
  args: DocumentPaneExtensionArgs,
) => DocumentPaneExtension | undefined

/** @internal Provide a hook (a stable function) that extends the document pane. */
export const DocumentPaneExtensionProvider =
  DocumentPaneExtensionContext.Provider as React.Provider<ResolveDocumentPaneExtension>

/** @internal */
export function useDocumentPaneExtension(
  args: DocumentPaneExtensionArgs,
): DocumentPaneExtension | undefined {
  const resolveExtension = useContext(DocumentPaneExtensionContext) as ResolveDocumentPaneExtension
  return resolveExtension(args)
}

/** @internal Set by the inspector panel while a host tab row is shown, so an inspector can drop its own header. */
export const DocumentInspectorTabsProvider = DocumentInspectorTabsContext.Provider

/** @internal True while the host's tab row replaces the inspectors' own headers. */
export function useInspectorTabsActive(): boolean {
  return useContext(DocumentInspectorTabsContext)
}
