import {type UseDocumentPaneExtension} from 'sanity/structure'

import {DocumentPillsV1} from '../c2/DocumentPills'
import {DocumentBannerV1} from '../c7/Banners'
import {STOCK_OPTION, useOption} from '../options/store'

/** C2 (pills) and C7 (banners) in the document pane, through the PROPOSED `DocumentPaneExtensionProvider`. */
export const useDocumentPaneOverride: UseDocumentPaneExtension = ({documentId, documentType}) => {
  const c2 = useOption('c2')
  const c7 = useOption('c7')
  const pills = c2 === 'a' || c2 === 'b' ? <DocumentPillsV1 documentId={documentId} option={c2} /> : undefined
  const banners =
    c7 === 'a' || c7 === 'b' ? <DocumentBannerV1 documentId={documentId} documentType={documentType} option={c7} /> : undefined
  if (c2 === STOCK_OPTION && c7 === STOCK_OPTION) return undefined
  return {pills, banners}
}
