import {useTranslation} from 'sanity'
import {useRouter, useRouterState} from 'sanity/router'

import {Button} from '../../../../../ui-components/button/Button'
import {LOADING_PANE} from '../../../../constants'
import {structureLocaleNamespace} from '../../../../i18n'
import {type Panes} from '../../../../structureResolvers/useResolvedPanes'
import {type RouterPanes} from '../../../../types'
import {useDocumentPreviewTitle} from './hook/useDocumentPreviewTitle'

export function DocumentHeaderBreadcrumbItem({
  paneData,
}: {
  paneData: Panes['paneDataItems'][number]
}) {
  const {pane} = paneData
  const router = useRouter()
  const {t} = useTranslation(structureLocaleNamespace)
  const routerState = useRouterState()
  const routerPanes = (routerState?.panes || []) as RouterPanes

  // Get the static title from the pane
  const staticTitle = pane !== LOADING_PANE && 'title' in pane ? pane.title : null

  // For document panes, get the document preview title
  const documentId = pane !== LOADING_PANE && pane.type === 'document' ? pane.options.id : null
  const documentType = pane !== LOADING_PANE && pane.type === 'document' ? pane.options.type : null
  const {title: previewTitle, isLoading} = useDocumentPreviewTitle(documentId, documentType)

  // Use preview title for documents, static title for other panes
  const displayTitle = documentId
    ? previewTitle
      ? previewTitle
      : t('panes.document-header-title.untitled.text')
    : staticTitle

  if (!displayTitle && !isLoading) return null

  return (
    <Button
      mode="bleed"
      text={displayTitle || t('panes.document-header-title.untitled.text')}
      tooltipProps={{content: displayTitle || t('panes.document-header-title.untitled.text')}}
      onClick={() => {
        router.navigate({panes: routerPanes.slice(0, paneData.groupIndex)})
      }}
    />
  )
}
