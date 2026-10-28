import {type ComponentType, type ReactNode, useContext} from 'react'
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
   * PROPOSED (open beta, T4): a control drawn first in the header's right-hand group, right after the presence avatars and before Share, in
   * both header layouts. The open beta puts the text button "Manage versions" here, which opens the version inventory (26 Oct, Faheem: the
   * entry to the inventory should say what it is).
   */
  headerLead?: ReactNode
  /**
   * PROPOSED (open beta, T4): a control drawn in the bottom action bar, just before the primary action (Publish). The open beta moves "Manage
   * versions" here from the header (27 Oct, Faheem): it sits with the document's actions.
   */
  footerLead?: ReactNode
  /**
   * PROPOSED: keep the bottom bar, with only `footerLead` in it, when core hides the bar because the chosen variant has no version in the
   * perspective. Without it the footer control goes with the bar, and the inventory has no entry there (28 Oct, Faheem).
   */
  footerLeadAlways?: boolean
  /**
   * PROPOSED: the order of the "..." menu's entries, by their action ("inspect:<inspector name>", "compareVersions", "inspect",
   * "toggleInlineChanges"). Listed entries come first in this order; the others follow in their own order. Only with the stock header.
   */
  menuOrder?: string[]
  /**
   * PROPOSED: the document's pane actions (Create new task) are drawn after the menu's entries, just above Copy and Paste document, not first.
   * Only with the stock header.
   */
  menuActionsLast?: boolean
  /**
   * PROPOSED (open beta header): controls drawn in the compact header's right-hand group, just before the "..." menu (for example the panels as icon
   * buttons). Only drawn with `compactHeader`.
   */
  headerPanels?: ReactNode
  /**
   * PROPOSED: the width an inspector opens at, by its name (undefined keeps the Studio's proportional default). The resize handle and the
   * 320 to 540 px limits are unchanged; the value is clamped to them.
   */
  inspectorInitialWidth?: (
    inspectorName: string,
    /** The document pane's width when the inspector opens, if known. */
    paneWidth?: number,
  ) => number | undefined
  /**
   * PROPOSED (open beta, T4): the list inside Compare versions' two pickers. Unset, the picker shows core's `DocumentGroupInventory`. The open beta
   * sets it to the same inventory the Versions inspector shows, so one document's versions read the same in both places. When the inventory
   * lands in core it replaces `DocumentGroupInventory`, and this slot goes away.
   */
  versionPicker?: ComponentType<DocumentVersionPickerProps>
}

/** @internal The props of a Compare versions picker's list. */
export interface DocumentVersionPickerProps {
  /** The published id of the document group. */
  documentId: string
  documentType: string
  /** The version this side shows. */
  selectedId: string
  /** The version the other side shows, which this side cannot also pick. */
  otherId: string | undefined
  /** Called with the picked version's document id. */
  onSelect: (documentId: string) => void
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
