import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'
import {useTranslation} from 'sanity'
import {useRouter, useRouterState} from 'sanity/router'

import {Button} from '../../../../../ui-components/button/Button'
import {LOADING_PANE} from '../../../../constants'
import {structureLocaleNamespace} from '../../../../i18n'
import {type Panes} from '../../../../structureResolvers/useResolvedPanes'
import {type RouterPanes} from '../../../../types'
import {FocusDocumentPaneNavigated} from './__telemetry__/focus.telemetry'
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
  const telemetry = useTelemetry()
  const routerPanes = useMemo(() => (routerState?.panes || []) as RouterPanes, [routerState?.panes])

  // In case if it's a pane with a title, use the title
  const staticTitle = pane !== LOADING_PANE && 'title' in pane ? pane.title : null

  // In case if it's a document pane, we need to fetch the document preview title
  const documentId = pane !== LOADING_PANE && pane.type === 'document' ? pane.options.id : null
  const documentType = pane !== LOADING_PANE && pane.type === 'document' ? pane.options.type : null
  const {title: previewTitle, isLoading} = useDocumentPreviewTitle(documentId, documentType)

  // Use preview title for documents, static title for other panes
  const displayTitle = useMemo(() => {
    if (documentId && !isLoading) {
      return previewTitle ? previewTitle : t('panes.document-header-title.untitled.text')
    }

    return staticTitle
  }, [documentId, previewTitle, staticTitle, t, isLoading])

  const handleClick = useCallback(() => {
    telemetry.log(FocusDocumentPaneNavigated)
    router.navigate({panes: routerPanes.slice(0, paneData.groupIndex)})
  }, [telemetry, router, routerPanes, paneData.groupIndex])

  if (!displayTitle && !isLoading) return null

  return (
    <Button
      mode="bleed"
      text={displayTitle || t('panes.document-header-title.untitled.text')}
      tooltipProps={{content: displayTitle || t('panes.document-header-title.untitled.text')}}
      onClick={handleClick}
    />
  )
}
