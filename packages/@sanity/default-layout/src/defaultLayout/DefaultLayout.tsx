import React, {memo, useState, useEffect, useCallback, useMemo} from 'react'
import {RouteScope} from '@sanity/base/router'
import {useSource, useDatastores} from '@sanity/base'
import {getNewDocumentOptions} from '@sanity/base/_internal'
import {LegacyLayerProvider} from '@sanity/base/components'
import {
  useCurrentUser,
  unstable_useTemplatePermissions as useTemplatePermissions,
} from '@sanity/base/hooks'
import {useStructureBuilder} from '@sanity/base/structure'
import Sidecar from '../addons/Sidecar'
import {RenderTool} from '../main/RenderTool'
import {CreateDocumentDialog} from '../createDocumentDialog'
import {SchemaErrorReporter} from '../schemaErrors/SchemaErrorReporter'
import {SideMenu} from '../sideMenu'
import {Navbar} from '../navbar'
import {useDefaultLayoutRouter} from '../useDefaultLayoutRouter'
import {RootFlex, MainAreaFlex, ToolBox, SidecarBox, PortalDiv} from './styles'
import {LoadingScreen} from './LoadingScreen'

export const DefaultLayout = memo(function DefaultLayout() {
  const source = useSource()
  const S = useStructureBuilder()
  const {grantsStore, userStore} = useDatastores()
  const newDocumentOptions = useMemo(
    () => getNewDocumentOptions(S, source.schema, source.initialValueTemplates, undefined),
    [source.initialValueTemplates, S, source.schema]
  )
  const router = useDefaultLayoutRouter()
  const [createMenuIsOpen, setCreateMenuIsOpen] = useState<boolean>(false)
  const [menuIsOpen, setMenuIsOpen] = useState<boolean>(false)
  const [showLoadingScreen, setShowLoadingScreen] = useState<boolean>(true)
  const [loaded, setLoaded] = useState<boolean>(false)
  const [searchIsOpen, setSearchIsOpen] = useState<boolean>(false)
  const [loadingScreenElement, setLoadingScreenElement] = useState<HTMLDivElement | null>(null)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const [createButtonElement, setCreateButtonElement] = useState<HTMLButtonElement | null>(null)

  const {value: currentUser} = useCurrentUser()
  const [templatePermissions, isTemplatePermissionsLoading] = useTemplatePermissions(
    grantsStore,
    source.schema,
    source.initialValueTemplates,
    newDocumentOptions
  )

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

    // Restore focus on the button when closing the dialog
    if (createButtonElement) {
      createButtonElement.focus()
    }
  }, [createButtonElement])

  const handleToggleMenu = useCallback(() => {
    setMenuIsOpen((prev) => !prev)
  }, [])

  const handleSwitchTool = useCallback(() => {
    setMenuIsOpen(false)
  }, [])

  const handleLogout = useCallback(() => {
    userStore.actions.logout()
  }, [userStore])

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
            templatePermissions={templatePermissions}
            isTemplatePermissionsLoading={isTemplatePermissionsLoading}
            createMenuIsOpen={createMenuIsOpen}
            onCreateButtonClick={handleCreateButtonClick}
            onToggleMenu={handleToggleMenu}
            onUserLogout={handleLogout}
            onSearchOpen={handleSearchOpen}
            searchPortalElement={portalElement}
            setCreateButtonElement={setCreateButtonElement}
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
            <CreateDocumentDialog
              templatePermissions={templatePermissions}
              isTemplatePermissionsLoading={isTemplatePermissionsLoading}
              onClose={handleActionModalClose}
            />
          </LegacyLayerProvider>
        )}

        {/* {absolutes.map((Abs, i) => (
          <Abs key={String(i)} />
        ))} */}
      </RootFlex>
    )
  }

  return <SchemaErrorReporter>{renderContent}</SchemaErrorReporter>
})
