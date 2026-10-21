import {useMemo} from 'react'
import {type ResolveDocumentPaneExtension} from 'sanity/structure'

import {OpenBetaBanner} from '../c7/OpenBetaBanner'
import {useOption} from '../options/store'
import {DocumentPillsV1} from './DocumentPills'

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
    // The version inventory opens at the midpoint of the inspector's 320 to 540 px limits; the resize handle keeps both.
    inspectorInitialWidth: (name) => (name === 'variants-inventory' ? 430 : undefined),
    // T6: the open beta banner (it replaces the stock variant banners, see VariantBannerReplacedProvider in options/FloatingOptions.tsx).
    banners: <OpenBetaBanner documentId={documentId} />,
    ...(state.c2 === 'a'
      ? {pills: <DocumentPillsV1 documentId={documentId} documentType={documentType} />}
      : {}),
  })
}
