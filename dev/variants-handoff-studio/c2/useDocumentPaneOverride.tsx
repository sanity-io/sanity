import {useMemo} from 'react'
import {type ResolveDocumentPaneExtension} from 'sanity/structure'

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
  return ({documentId, documentType}) =>
    state.c2 === 'a'
      ? {pills: <DocumentPillsV1 documentId={documentId} documentType={documentType} />}
      : undefined
}
