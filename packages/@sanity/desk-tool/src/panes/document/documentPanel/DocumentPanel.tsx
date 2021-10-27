import {BoundaryElementProvider, Flex, PortalProvider, usePortal, useElementRect} from '@sanity/ui'
import React, {createElement, useEffect, useMemo, useRef, useState} from 'react'
import {ScrollContainer} from '@sanity/base/components'
import {unstable_useDocumentValuePermissions as useDocumentValuePermissions} from '@sanity/base/hooks'
import styled, {css} from 'styled-components'
import {SchemaType} from '@sanity/types'
import {PaneContent} from '../../../components/pane'
import {usePaneLayout} from '../../../components/pane/usePaneLayout'
import {useDeskTool} from '../../../contexts/deskTool'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentPanelHeader} from './header'
import {FormView} from './documentViews'
import {PermissionCheckBanner} from './PermissionCheckBanner'
import {ReferenceChangedBanner} from './ReferenceChangedBanner'

function getSchemaType(typeName: string): SchemaType | null {
  const schemaMod = require('part:@sanity/base/schema')
  const schema = schemaMod.default || schemaMod
  const type = schema.get(typeName)
  if (!type) return null
  return type
}

interface DocumentPanelProps {
  footerHeight: number | null
  rootElement: HTMLDivElement | null
}

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
  const {footerHeight, rootElement} = props
  const {
    activeViewId,
    displayed,
    documentId,
    documentSchema,
    editState,
    value,
    views,
    ready,
    documentType,
  } = useDocumentPane()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const parentPortal = usePortal()
  const {features} = useDeskTool()
  const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null)
  const headerRect = useElementRect(headerElement)
  const portalRef = useRef<HTMLDivElement | null>(null)
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)

  const requiredPermission = value._createdAt ? 'update' : 'create'
  const liveEdit = useMemo(() => Boolean(getSchemaType(documentType)?.liveEdit), [documentType])
  const docPermissionsInput = useMemo(() => {
    return {...value, _id: liveEdit ? 'dummy-id' : 'drafts.dummy-id'}
  }, [liveEdit, value])
  const [permissions, isPermissionsLoading] = useDocumentValuePermissions({
    document: docPermissionsInput,
    permission: requiredPermission,
  })

  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) || views[0] || {type: 'form'},
    [activeViewId, views]
  )

  // Use a local portal container when split panes is supported
  const portalElement: HTMLElement | null = features.splitPanes
    ? portalRef.current || parentPortal.element
    : parentPortal.element

  // Calculate the height of the header
  const margins: [number, number, number, number] = useMemo(() => {
    if (layoutCollapsed) {
      return [headerRect?.height || 0, 0, footerHeight ? footerHeight + 2 : 2, 0]
    }

    return [0, 0, 2, 0]
  }, [layoutCollapsed, footerHeight, headerRect])

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
        schemaType: documentSchema,
      }),
    [
      activeView,
      displayed,
      documentId,
      documentSchema,
      editState?.draft,
      editState?.published,
      value,
    ]
  )

  // Scroll to top as `documentId` changes
  useEffect(() => {
    if (!documentScrollElement?.scrollTo) return
    documentScrollElement.scrollTo(0, 0)
  }, [documentId, documentScrollElement])

  return (
    <Flex direction="column" flex={2} overflow={layoutCollapsed ? undefined : 'hidden'}>
      <DocumentPanelHeader rootElement={rootElement} ref={setHeaderElement} />

      <PaneContent>
        <PortalProvider element={portalElement}>
          <BoundaryElementProvider element={documentScrollElement}>
            {activeView.type === 'form' && !isPermissionsLoading && ready && (
              <>
                <PermissionCheckBanner
                  granted={Boolean(permissions?.granted)}
                  requiredPermission={requiredPermission}
                />
                <ReferenceChangedBanner />
              </>
            )}

            <Scroller
              $disabled={layoutCollapsed || false}
              data-testid="document-panel-scroller"
              ref={setDocumentScrollElement}
            >
              <FormView
                hidden={formViewHidden}
                key={documentId + (ready ? '_ready' : '_pending')}
                margins={margins}
                granted={Boolean(permissions?.granted)}
              />
              {activeViewNode}
            </Scroller>

            <div data-testid="document-panel-portal" ref={portalRef} />
          </BoundaryElementProvider>
        </PortalProvider>
      </PaneContent>
    </Flex>
  )
}
