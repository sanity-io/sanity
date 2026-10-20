import {type UseDocumentPaneExtension} from 'sanity/structure'

import {DocumentPillsV1} from '../c2/DocumentPills'
import {ManageVersions} from '../c4/ManageVersions'
import {DocumentBannerV1} from '../c7/Banners'
import {useComparison} from '../compare/useCompare'
import {STOCK_OPTION, useOption} from '../options/store'
import {PresentationContextLine} from '../presentation/PresentationContextLine'
import {DocumentsCount, LocalRow} from './PaneAddress'

/** C2 (pills) and C7 (banners) in the document pane, through the PROPOSED `DocumentPaneExtensionProvider`. */
export const useDocumentPaneOverride: UseDocumentPaneExtension = ({documentId, documentType}) => {
  const c2 = useOption('c2')
  const c7 = useOption('c7')
  const c4 = useOption('c4')
  const paneAddress = useOption('paneAddress')
  const compare = useOption('compare')
  const comparison = useComparison()
  const manageIcon = c4 === 'b' ? <ManageVersions documentId={documentId} form="icon" /> : undefined
  // E9 paneAddress B and C replace the chips with a Documents count; C (and a compare) adds the local row under the header.
  const pills =
    paneAddress !== 'a' ? (
      <DocumentsCount documentId={documentId} manage={manageIcon} />
    ) : c2 === 'a' || c2 === 'b' ? (
      <DocumentPillsV1 documentId={documentId} manage={manageIcon} option={c2} />
    ) : undefined
  const localRow =
    paneAddress === 'c' || compare !== 'a' ? (
      <LocalRow documentId={documentId} documentType={documentType} />
    ) : undefined
  const banner =
    c7 === 'a' || c7 === 'b' ? (
      <DocumentBannerV1 documentId={documentId} documentType={documentType} option={c7} />
    ) : undefined
  // C4 B: the inventory as a popover from "Manage versions".
  // Presentation (P2): the version's context line and a way back to "On this page".
  const context = <PresentationContextLine documentId={documentId} />
  const manage = c4 === 'b' && !pills ? <ManageVersions documentId={documentId} /> : undefined
  const banners = (
    <>
      {localRow}
      {context}
      {manage}
      {banner}
    </>
  )
  if (
    c2 === STOCK_OPTION &&
    c7 === STOCK_OPTION &&
    !manage &&
    c4 === STOCK_OPTION &&
    !pills &&
    !localRow
  )
    return undefined
  return {pills, banners}
}
