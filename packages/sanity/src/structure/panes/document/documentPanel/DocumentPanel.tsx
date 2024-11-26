import {BoundaryElementProvider, Box, Flex, PortalProvider, usePortal} from '@sanity/ui'
import {createElement, useEffect, useMemo, useRef, useState} from 'react'
import {
  isDraftPerspective,
  isPublishedPerspective,
  isReleaseScheduledOrScheduling,
  type ReleaseDocument,
  ScrollContainer,
  usePerspective,
  VirtualizerScrollInstanceProvider,
} from 'sanity'
import {css, styled} from 'styled-components'

import {PaneContent, usePane, usePaneLayout} from '../../../components'
import {isLiveEditEnabled} from '../../../components/paneItem/helpers'
import {useStructureTool} from '../../../useStructureTool'
import {DocumentInspectorPanel} from '../documentInspector'
import {InspectDialog} from '../inspectDialog'
import {useDocumentPane} from '../useDocumentPane'
import {
  DeletedDocumentBanners,
  DeprecatedDocumentTypeBanner,
  PermissionCheckBanner,
  ReferenceChangedBanner,
} from './banners'
import {AddToReleaseBanner} from './banners/AddToReleaseBanner'
import {DraftLiveEditBanner} from './banners/DraftLiveEditBanner'
import {FormView} from './documentViews'

interface DocumentPanelProps {
  footerHeight: number | null
  headerHeight: number | null
  isInspectOpen: boolean
  rootElement: HTMLDivElement | null
  setDocumentPanelPortalElement: (el: HTMLElement | null) => void
}

const DocumentBox = styled(Box)({
  position: 'relative',
})

const Scroller = styled(ScrollContainer)<{$disabled: boolean}>(({$disabled}) => {
  if ($disabled) {
    return {height: '100%'}
  }

  return css`
    height: 100%;
    overflow: auto;
    position: relative;
    scroll-behavior: smooth;
    outline: none;
  `
})

export const DocumentPanel = function DocumentPanel(props: DocumentPanelProps) {
  const {footerHeight, headerHeight, isInspectOpen, rootElement, setDocumentPanelPortalElement} =
    props
  const {
    activeViewId,
    displayed,
    documentId,
    editState,
    inspector,
    value,
    views,
    ready,
    schemaType,
    permissions,
    isPermissionsLoading,
    existsInBundle,
    documentType,
  } = useDocumentPane()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const {collapsed} = usePane()
  const parentPortal = usePortal()
  const {features} = useStructureTool()
  const portalRef = useRef<HTMLDivElement | null>(null)
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const formContainerElement = useRef<HTMLDivElement | null>(null)

  const requiredPermission = value._createdAt ? 'update' : 'create'

  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) || views[0] || {type: 'form'},
    [activeViewId, views],
  )

  // Use a local portal container when split panes is supported
  const portalElement: HTMLElement | null = features.splitPanes
    ? portalRef.current || parentPortal.element
    : parentPortal.element

  // Calculate the height of the header
  const margins: [number, number, number, number] = useMemo(() => {
    if (layoutCollapsed) {
      return [headerHeight || 0, 0, footerHeight ? footerHeight + 2 : 2, 0]
    }

    return [0, 0, 2, 0]
  }, [layoutCollapsed, footerHeight, headerHeight])

  const formViewHidden = activeView.type !== 'form'

  const activeViewNode = useMemo(
    () =>
      activeView.type === 'component' &&
      activeView.component &&
      createElement(activeView.component, {
        document: {
          draft: editState?.draft || null,
          displayed: displayed || value,
          historical: displayed,
          published: editState?.published || null,
        },
        documentId,
        options: activeView.options,
        schemaType,
      }),
    [activeView, displayed, documentId, editState?.draft, editState?.published, schemaType, value],
  )

  const isLiveEdit = isLiveEditEnabled(schemaType)

  // Scroll to top as `documentId` changes
  useEffect(() => {
    if (!documentScrollElement?.scrollTo) return
    documentScrollElement.scrollTo(0, 0)
  }, [documentId, documentScrollElement])

  // Pass portal element to `DocumentPane`
  useEffect(() => {
    if (portalElement) {
      setDocumentPanelPortalElement(portalElement)
    }
  }, [portalElement, setDocumentPanelPortalElement])

  const inspectDialog = useMemo(() => {
    return isInspectOpen ? <InspectDialog value={displayed || value} /> : null
  }, [isInspectOpen, displayed, value])

  const showInspector = Boolean(!collapsed && inspector)
  const {currentGlobalBundle} = usePerspective()

  const currentPerspectiveIsRelease =
    !isPublishedPerspective(currentGlobalBundle) && !isDraftPerspective(currentGlobalBundle)
  const isScheduledRelease =
    typeof currentGlobalBundle === 'object' && 'state' in currentGlobalBundle
      ? isReleaseScheduledOrScheduling(currentGlobalBundle)
      : false

  const banners = useMemo(() => {
    if ((!existsInBundle && currentPerspectiveIsRelease) || isScheduledRelease) {
      return (
        <AddToReleaseBanner
          documentId={value._id}
          currentRelease={currentGlobalBundle as ReleaseDocument}
          value={displayed || undefined}
        />
      )
    }

    if (activeView.type === 'form' && isLiveEdit && ready) {
      return (
        <DraftLiveEditBanner
          displayed={displayed}
          documentId={documentId}
          schemaType={schemaType}
        />
      )
    }

    if (activeView.type !== 'form' || isPermissionsLoading || !ready) return null

    return (
      <>
        <PermissionCheckBanner
          granted={Boolean(permissions?.granted)}
          requiredPermission={requiredPermission}
        />
        <ReferenceChangedBanner />
        <DeprecatedDocumentTypeBanner />
        <DeletedDocumentBanners />
      </>
    )
  }, [
    activeView.type,
    currentGlobalBundle,
    currentPerspectiveIsRelease,
    displayed,
    documentId,
    existsInBundle,
    isLiveEdit,
    isPermissionsLoading,
    isScheduledRelease,
    permissions?.granted,
    ready,
    requiredPermission,
    schemaType,
    value._id,
  ])

  return (
    <PaneContent>
      {banners}
      <Flex height="fill">
        {(features.resizablePanes || !showInspector) && (
          <DocumentBox flex={2} overflow="hidden">
            <PortalProvider
              element={portalElement}
              __unstable_elements={{documentScrollElement: documentScrollElement}}
            >
              <BoundaryElementProvider element={documentScrollElement}>
                <VirtualizerScrollInstanceProvider
                  scrollElement={documentScrollElement}
                  containerElement={formContainerElement}
                >
                  <Scroller
                    $disabled={layoutCollapsed || false}
                    data-testid="document-panel-scroller"
                    ref={setDocumentScrollElement}
                  >
                    <FormView
                      hidden={formViewHidden}
                      margins={margins}
                      ref={formContainerElement}
                    />
                    {activeViewNode}
                  </Scroller>

                  {inspectDialog}

                  <div data-testid="document-panel-portal" ref={portalRef} />
                </VirtualizerScrollInstanceProvider>
              </BoundaryElementProvider>
            </PortalProvider>
          </DocumentBox>
        )}

        {showInspector && (
          <BoundaryElementProvider element={rootElement}>
            <DocumentInspectorPanel
              documentId={documentId}
              documentType={schemaType.name}
              flex={1}
            />
          </BoundaryElementProvider>
        )}
      </Flex>
    </PaneContent>
  )
}
