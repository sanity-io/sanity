import {useMemo} from 'react'
import {type ResolveDocumentPaneExtension} from 'sanity/structure'

import {PickerInventory} from '../c4/inventory/PickerInventory'
import {NewDocumentDestination} from '../c7/NewDocumentDestination'
import {OpenBetaBanner} from '../c7/OpenBetaBanner'
import {useOption} from '../options/store'
import {DocumentPillsV1} from './DocumentPills'
import {ManageVersionsButton} from './ManageVersionsButton'

/** The studio-wide state the pane extension reads (hooks run here, once, not per document). */
export function useDocumentPaneOverrideState() {
  const c2 = useOption('c2')
  return useMemo(() => ({c2}), [c2])
}
export type DocumentPaneOverrideState = ReturnType<typeof useDocumentPaneOverrideState>

/**
 * C2 (document pills) in the document pane, through the PROPOSED `DocumentPaneExtensionProvider`. The Handoff Studio is fixed on C2 A: the pane
 * header, its "..." menu and the inspector stay as the Studio ships them.
 */
export function resolveDocumentPaneOverride(
  state: DocumentPaneOverrideState,
): ResolveDocumentPaneExtension {
  return ({documentId, documentType}) => ({
    // The version inventory opens at the midpoint of the inspector's 320 to 540 px limits; the resize handle keeps both. In a narrow pane
    // (Presentation, a split pane) it opens at 45% of the pane instead, so the form keeps room (Faheem, 23 Oct); Studio's 320 px minimum holds.
    inspectorInitialWidth: (name, paneWidth) =>
      name === 'variants-inventory'
        ? Math.min(430, paneWidth ? Math.round(paneWidth * 0.45) : 430)
        : undefined,
    // T6: the open beta banner (it replaces the stock variant banners, see VariantBannerReplacedProvider in options/FloatingOptions.tsx).
    banners: (
      <>
        <NewDocumentDestination documentId={documentId} />
        <OpenBetaBanner documentId={documentId} />
      </>
    ),
    // T4: the text button that opens the inventory, in the bottom action bar just before Publish (27 Oct, Faheem: it was first in the header's
    // right-hand group; the "..." menu's Versions entry already opens it from the header).
    footerLead: <ManageVersionsButton />,
    // The "..." menu (27 Oct, Faheem): Versions first, then Compare versions, History, Incoming references, Inspect and Inline changes; Create new
    // task goes to the bottom, just above Copy and Paste document.
    menuOrder: [
      'inspect:variants-inventory',
      'compareVersions',
      'inspect:sanity/structure/history',
      'inspect:sanity/structure/incoming-references',
      'inspect',
      'toggleInlineChanges',
    ],
    menuActionsLast: true,
    // T4: Compare versions' pickers list the versions with the same inventory as the Versions inspector.
    versionPicker: PickerInventory,
    ...(state.c2 === 'a'
      ? {pills: <DocumentPillsV1 documentId={documentId} documentType={documentType} />}
      : {}),
  })
}
