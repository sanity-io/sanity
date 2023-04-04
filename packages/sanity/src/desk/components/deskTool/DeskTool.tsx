import {PortalProvider, useToast} from '@sanity/ui'
import React, {memo, useState, useEffect, useCallback} from 'react'
import styled from 'styled-components'
import isHotkey from 'is-hotkey'
import {PaneLayout} from '../pane'
import {useDeskTool} from '../../useDeskTool'
import {NoDocumentTypesScreen} from './NoDocumentTypesScreen'
import {useSchema, _isCustomDocumentTypeDefinition} from 'sanity'

const StyledPaneLayout = styled(PaneLayout)`
  min-height: 100%;
  min-width: 320px;
`

const isSaveHotkey = isHotkey('mod+s')

/**
 * @internal
 */
export const DeskTool = memo(function DeskTool() {
  const {push: pushToast} = useToast()
  const schema = useSchema()
  const {layoutCollapsed, setLayoutCollapsed} = useDeskTool()

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const handleRootCollapse = useCallback(() => setLayoutCollapsed(true), [setLayoutCollapsed])
  const handleRootExpand = useCallback(() => setLayoutCollapsed(false), [setLayoutCollapsed])

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Prevent `Cmd+S`
      if (isSaveHotkey(event)) {
        event.preventDefault()

        pushToast({
          closable: true,
          id: 'auto-save-message',
          status: 'info',
          title: 'Your work is automatically saved!',
          duration: 4000,
        })
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [pushToast])

  const hasDefinedDocumentTypes = schema._original?.types.some(_isCustomDocumentTypeDefinition)

  if (!hasDefinedDocumentTypes) {
    return <NoDocumentTypesScreen />
  }

  return (
    <PortalProvider element={portalElement || null}>
      <StyledPaneLayout
        flex={1}
        height={layoutCollapsed ? undefined : 'fill'}
        minWidth={512}
        onCollapse={handleRootCollapse}
        onExpand={handleRootExpand}
      >
        DeskToolPanes
      </StyledPaneLayout>
      <div data-portal="" ref={setPortalElement} />
    </PortalProvider>
  )
})
