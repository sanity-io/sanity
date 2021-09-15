// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {useState, useEffect, useCallback} from 'react'
import {RouteScope, withRouterHOC} from '@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import userStore from 'part:@sanity/base/user'
import {LegacyLayerProvider} from '@sanity/base/components'
import {useCurrentUser} from '@sanity/base/hooks'
import Sidecar from '../addons/Sidecar'
import RenderTool from '../main/RenderTool'
import {CreateDocumentDialog} from '../createDocumentDialog'
import {SchemaErrorReporter} from '../schemaErrors/SchemaErrorReporter'
import {SideMenu} from '../sideMenu'
import getNewDocumentModalActions from '../util/getNewDocumentModalActions'
import {Router, Tool} from '../types'
import {Navbar} from '../navbar'
import {RootFlex, MainAreaFlex, ToolBox, SidecarBox, PortalBox} from './styles'
import {LoadingScreen} from './LoadingScreen'

interface OuterProps {
  tools: Tool[]
}

interface Props {
  router: Router
  tools: Tool[]
}

export const DefaultLayout = withRouterHOC((props: Props) => {
  const {tools, router} = props
  const [createMenuIsOpen, setCreateMenuIsOpen] = useState<boolean>(false)
  const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false)
  const [showLoadingScreen, setShowLoadingScreen] = useState<boolean>(true)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [searchIsOpen, setSearchIsOpen] = useState<boolean>(false)
  const [loadingScreenElement, setLoadingScreenElement] = useState<HTMLDivElement | null>(null)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const {value: currentUser} = useCurrentUser()

  useEffect(() => {
    if (!loaded) {
      setLoaded(true)
    }
  }, [loaded])

  const handleAnimationEnd = useCallback(() => {
    setShowLoadingScreen(false)
  }, [])

  useEffect(() => {
    if (loadingScreenElement) {
      loadingScreenElement.addEventListener('animationend', handleAnimationEnd, false)
    }
    return () => {
      if (loadingScreenElement) {
        loadingScreenElement.removeEventListener('animationend', handleAnimationEnd, false)
      }
    }
  }, [handleAnimationEnd, loadingScreenElement])

  const handleCreateButtonClick = useCallback(() => {
    setCreateMenuIsOpen((prev) => !prev)
  }, [])

  const handleActionModalClose = useCallback(() => {
    setCreateMenuIsOpen(false)
  }, [])

  const handleToggleMenu = useCallback(() => {
    setMenuIsOpen((prev) => !prev)
  }, [])

  const handleSwitchTool = useCallback(() => {
    setMenuIsOpen(false)
  }, [])

  const handleLogout = useCallback(() => {
    userStore.actions.logout()
  }, [])

  const handleSearchOpen = useCallback((open) => {
    setSearchIsOpen(open)
  }, [])

  const renderContent = () => {
    const isOverlayVisible = menuIsOpen || searchIsOpen
    const tool = router?.state?.tool || ''
    const documentTypes = getNewDocumentModalActions().map((action) => action.schemaType)

    return (
      <RootFlex
        $isOverlayVisible={isOverlayVisible}
        direction="column"
        height="fill"
        sizing="border"
      >
        {showLoadingScreen && (
          <LoadingScreen
            loaded={loaded || document.visibilityState == 'hidden'}
            ref={setLoadingScreenElement}
          />
        )}

        <LegacyLayerProvider zOffset="navbar">
          <Navbar
            tools={tools}
            createMenuIsOpen={createMenuIsOpen}
            onCreateButtonClick={handleCreateButtonClick}
            onToggleMenu={handleToggleMenu}
            router={router}
            documentTypes={documentTypes}
            onUserLogout={handleLogout}
            searchIsOpen={handleSearchOpen}
            searchPortalElement={portalElement}
          />
        </LegacyLayerProvider>

        {currentUser && (
          <SideMenu
            activeToolName={tool}
            isOpen={menuIsOpen}
            onClose={handleToggleMenu}
            onSignOut={handleLogout}
            onSwitchTool={handleSwitchTool}
            router={router}
            tools={tools}
            user={currentUser}
          />
        )}

        <MainAreaFlex flex={1} height="fill" overflow={isOverlayVisible ? 'hidden' : undefined}>
          <ToolBox hidden={searchIsOpen} height="fill" flex={1}>
            <RouteScope scope={tool}>
              <RenderTool tool={tool} />
            </RouteScope>
          </ToolBox>

          <SidecarBox hidden={searchIsOpen}>
            <Sidecar />
          </SidecarBox>

          {searchIsOpen && <PortalBox flex={1} ref={setPortalElement} />}
        </MainAreaFlex>

        {createMenuIsOpen && (
          <LegacyLayerProvider zOffset="navbar">
            <CreateDocumentDialog
              onClose={handleActionModalClose}
              actions={getNewDocumentModalActions()}
            />
          </LegacyLayerProvider>
        )}

        {absolutes.map((Abs, i) => (
          <Abs key={String(i)} />
        ))}
      </RootFlex>
    )
  }

  return <SchemaErrorReporter>{renderContent}</SchemaErrorReporter>
}) as React.ComponentType<OuterProps>
