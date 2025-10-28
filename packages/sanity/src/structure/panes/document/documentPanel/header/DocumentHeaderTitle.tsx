import {Flex} from '@sanity/ui'
import {Fragment, useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {getPreviewStateObservable, useDocumentPreviewStore, useSchema, useTranslation} from 'sanity'
import {useRouter, useRouterState} from 'sanity/router'

import {Button} from '../../../../../ui-components'
import {LOADING_PANE} from '../../../../constants'
import {structureLocaleNamespace} from '../../../../i18n'
import {useResolvedPanes} from '../../../../structureResolvers/useResolvedPanes'
import {type RouterPanes} from '../../../../types'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentTitle} from '../../useDocumentTitle'

// Hook to get a single document's preview title
function useDocumentPreviewTitle(documentId: string | null, documentType: string | null) {
  const documentPreviewStore = useDocumentPreviewStore()
  const schema = useSchema()
  const schemaType = documentType ? schema.get(documentType) : null

  const observable = useMemo(() => {
    if (!documentId || !schemaType) return of({isLoading: true, snapshot: null})
    return getPreviewStateObservable(documentPreviewStore, schemaType, documentId)
  }, [documentId, documentPreviewStore, schemaType])

  const previewState = useObservable(observable, {isLoading: true, snapshot: null})

  return {
    title: previewState?.snapshot?.title as string | undefined,
    isLoading: previewState?.isLoading ?? true,
  }
}

// Component to render a single pane title button
function PaneTitleButton({
  paneData,
  routerPanes,
  router,
}: {
  paneData: ReturnType<typeof useResolvedPanes>['paneDataItems'][number]
  routerPanes: RouterPanes
  router: ReturnType<typeof useRouter>
}) {
  const {pane} = paneData

  // Get the static title from the pane
  const staticTitle = pane !== LOADING_PANE && 'title' in pane ? pane.title : null

  // For document panes, get the document preview title
  const documentId = pane !== LOADING_PANE && pane.type === 'document' ? pane.options.id : null
  const documentType = pane !== LOADING_PANE && pane.type === 'document' ? pane.options.type : null
  const {title: previewTitle, isLoading} = useDocumentPreviewTitle(documentId, documentType)

  // Use preview title for documents, static title for other panes
  const displayTitle = documentId ? previewTitle : staticTitle

  if (!displayTitle && !isLoading) return null

  return (
    <Button
      mode="bleed"
      text={displayTitle || '...'}
      tooltipProps={{content: displayTitle || '...'}}
      onClick={() => {
        router.navigate({panes: routerPanes.slice(0, paneData.groupIndex)})
      }}
    />
  )
}

export function DocumentHeaderTitle(): React.JSX.Element {
  const {connectionState, schemaType, title, value: documentValue, focused} = useDocumentPane()
  const {paneDataItems} = useResolvedPanes()
  const {title: documentTitle, error} = useDocumentTitle()
  const router = useRouter()
  const routerState = useRouterState()
  const routerPanes = (routerState?.panes || []) as RouterPanes
  const subscribed = Boolean(documentValue)

  const {t} = useTranslation(structureLocaleNamespace)

  if (connectionState === 'connecting' && !subscribed) {
    return <></>
  }

  if (title) {
    return <>{title}</>
  }

  if (!documentValue) {
    return (
      <>
        {t('panes.document-header-title.new.text', {
          schemaType: schemaType?.title || schemaType?.name,
        })}
      </>
    )
  }

  if (error) {
    return <>{t('panes.document-header-title.error.text', {error: error})}</>
  }

  const focusIndex = paneDataItems.findIndex((paneData) => paneData.focused)

  return (
    <>
      {focused ? (
        <Flex direction="row" align="center">
          {paneDataItems.map((paneData, index) => {
            if (focusIndex > index) return null
            return (
              <Fragment key={paneData.key}>
                <PaneTitleButton
                  key={paneData.key}
                  paneData={paneData}
                  routerPanes={routerPanes}
                  router={router}
                />

                {index < paneDataItems.length - 1 && <>/</>}
              </Fragment>
            )
          })}
        </Flex>
      ) : (
        documentTitle || (
          <span style={{color: 'var(--card-muted-fg-color)'}}>
            {t('panes.document-header-title.untitled.text')}
          </span>
        )
      )}
    </>
  )
}
