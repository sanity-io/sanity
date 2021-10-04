// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {memo, useState, useEffect, useCallback} from 'react'
import {RouteScope} from '@sanity/base/router'
import absolutes from 'all:part:@sanity/base/absolutes'
import userStore from 'part:@sanity/base/user'
import {LegacyLayerProvider} from '@sanity/base/components'
import {useCurrentUser} from '@sanity/base/hooks'
import Sidecar from '../addons/Sidecar'
import {RenderTool} from '../main/RenderTool'
import {CreateDocumentDialog} from '../createDocumentDialog'
import {SchemaErrorReporter} from '../schemaErrors/SchemaErrorReporter'
import {SideMenu} from '../sideMenu'
import {Navbar} from '../navbar'
import {useDefaultLayoutRouter} from '../useDefaultLayoutRouter'
import {NEW_DOCUMENT_ACTIONS, NEW_DOCUMENT_TYPES} from '../constants'
import {RootFlex, MainAreaFlex, ToolBox, SidecarBox, PortalDiv} from './styles'
import {LoadingScreen} from './LoadingScreen'

export const DefaultLayout = memo(function DefaultLayout() {
  const router = useDefaultLayoutRouter()
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
    const tool = router.state.tool || ''

    return (
      <RootFlex $isOverlayVisible={menuIsOpen} data-testid="default-layout" direction="column">
        {showLoadingScreen && (
          <LoadingScreen
            loaded={loaded || document.visibilityState == 'hidden'}
            ref={setLoadingScreenElement}
          />
        )}

        <LegacyLayerProvider zOffset="navbar">
          <Navbar
            createMenuIsOpen={createMenuIsOpen}
            onCreateButtonClick={handleCreateButtonClick}
            onToggleMenu={handleToggleMenu}
            documentTypes={NEW_DOCUMENT_TYPES}
            onUserLogout={handleLogout}
            onSearchOpen={handleSearchOpen}
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
            user={currentUser}
          />
        )}

        <MainAreaFlex
          direction={['column', 'row']}
          flex={1}
          overflow={menuIsOpen ? 'hidden' : undefined}
        >
          <ToolBox
            data-testid="default-layout__tool-box"
            direction="column"
            flex={1}
            hidden={searchIsOpen}
            height="fill"
          >
            <RouteScope scope={tool}>
              <RenderTool tool={tool} />
            </RouteScope>
          </ToolBox>

          <SidecarBox hidden={searchIsOpen}>
            <Sidecar />
          </SidecarBox>

          {searchIsOpen && <PortalDiv ref={setPortalElement} />}
        </MainAreaFlex>

        {createMenuIsOpen && (
          <LegacyLayerProvider zOffset="navbar">
            <CreateDocumentDialog onClose={handleActionModalClose} actions={NEW_DOCUMENT_ACTIONS} />
          </LegacyLayerProvider>
        )}

        {absolutes.map((Abs, i) => (
          <Abs key={String(i)} />
        ))}
      </RootFlex>
    )
  }

  return <SchemaErrorReporter>{renderContent}</SchemaErrorReporter>
})
