import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'
import {type ResolvedPanes, useDocumentPreviewValues, usePerspective, useTranslation} from 'sanity'
import {useRouter, useRouterState} from 'sanity/router'

import {Button} from '../../../../../ui-components/button/Button'
import {LOADING_PANE} from '../../../../constants'
import {structureLocaleNamespace} from '../../../../i18n'
import {type PaneNode, type RouterPanes} from '../../../../types'
import {DocumentPaneNavigated} from './__telemetry__/focus.telemetry'

export function DocumentHeaderBreadcrumbItem({
  paneData,
  index,
}: {
  paneData: ResolvedPanes['paneDataItems'][number]
  index: number
}) {
  const {pane} = paneData
  const router = useRouter()
  const {t} = useTranslation(structureLocaleNamespace)
  const routerState = useRouterState()
  const telemetry = useTelemetry()
  const routerPanes = useMemo(() => (routerState?.panes || []) as RouterPanes, [routerState?.panes])

  const {perspectiveStack, selectedVariantName} = usePerspective()
  // The resolved pane data is typed minimally in core; the structure tool
  // resolves the full pane node union.
  const paneNode = pane === LOADING_PANE ? null : (pane as PaneNode)
  // In case if it's a pane with a title, use the title
  const staticTitle = paneNode ? paneNode.title : null

  // In case if it's a document pane, we need to fetch the document preview title
  const documentId = paneNode?.type === 'document' ? paneNode.options.id : null
  const documentType = paneNode?.type === 'document' ? paneNode.options.type : null
  const {value: previewValue, isLoading} = useDocumentPreviewValues({
    documentId: documentId ?? '',
    documentType: documentType ?? '',
    perspectiveStack: perspectiveStack,
    variant: selectedVariantName,
  })

  // Use preview title for documents, static title for other panes
  const displayTitle = useMemo(() => {
    if (documentId && !isLoading) {
      return previewValue?.title || t('panes.document-header-title.untitled.text')
    }

    return staticTitle
  }, [documentId, previewValue, staticTitle, t, isLoading])

  const handleClick = useCallback(() => {
    telemetry.log(DocumentPaneNavigated, {path: 'breadcrumb'})
    router.navigate({panes: routerPanes.slice(0, paneData.groupIndex)})
  }, [telemetry, router, routerPanes, paneData.groupIndex])

  if (!displayTitle && !isLoading) return null

  return (
    <Button
      mode="bleed"
      text={displayTitle || t('panes.document-header-title.untitled.text')}
      tooltipProps={{content: displayTitle || t('panes.document-header-title.untitled.text')}}
      onClick={handleClick}
      paddingLeft={index === 0 ? 0 : 1}
    />
  )
}
