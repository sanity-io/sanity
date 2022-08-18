// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {createElement, memo, useCallback, useState, useEffect, useMemo} from 'react'
import {SearchIcon, MenuIcon, ComposeIcon} from '@sanity/icons'
import {Button, Card, Tooltip, useMediaIndex, Text, Box, Flex} from '@sanity/ui'
import {InsufficientPermissionsMessage, LegacyLayerProvider} from '@sanity/base/components'
import {StateLink} from '@sanity/base/router'
import {useCurrentUser} from '@sanity/base/hooks'
import config from 'config:sanity'
import * as sidecar from 'part:@sanity/default-layout/sidecar?'
import ToolMenu from 'part:@sanity/default-layout/tool-switcher'
import styled from 'styled-components'
import {getNewDocumentOptions, TemplatePermissionsResult} from '@sanity/base/_internal'
import {HAS_SPACES} from '../util/spaces'
import {DatasetSelect} from '../datasetSelect'
import {useDefaultLayoutRouter} from '../useDefaultLayoutRouter'
import {tools} from '../config'
import {versionedClient} from '../versionedClient'
import Branding from './branding/Branding'
import {ChangelogContainer} from './changelog'
import {SearchProvider} from './search/contexts/search'
import {SearchDialog, SearchField} from './search'
import {PresenceMenu, LoginStatus} from '.'

interface NavbarProps {
  createMenuIsOpen: boolean
  isTemplatePermissionsLoading: boolean
  onCreateButtonClick: () => void
  onSearchFullscreenOpen: (open: boolean) => void
  onToggleMenu: () => void
  onUserLogout: () => void
  searchFullscreenOpen: boolean
  setCreateButtonElement?: (el: HTMLButtonElement | null) => void
  templatePermissions: TemplatePermissionsResult[] | undefined
}

const Root = styled(Card)<{$onSearchFullscreenOpen: boolean}>`
  top: 0;
  position: relative;
  z-index: 1;
  min-height: auto;
`

const BrandingButton = styled(Button)`
  --card-fg-color: inherit !important;
  display: block;
`

const LeftFlex = styled(Flex)`
  width: max-content;
`

const CenterBox = styled(Box)``

const RightFlex = styled(Flex)``

const SpacingBox = styled(Box)`
  &:empty {
    margin: 0;
  }
`

/**
 * `Navbar` is the main navigation of Studio apps.
 *
 * The navbar layout consists of 3 wrappers:
 * ```
 * | LeftFlex | CenterBox | RightFlex |
 * ```
 *
 * LARGE screens:
 * ```
 * | LeftFlex                                               | RightFlex                            |
 * | Branding, DatasetSelect, CreateDocument, Search, Tools | Status, Hints, Presence, LoginStatus |
 * ```
 *
 * MEDIUM screens:
 * ```
 * | LeftFlex                                   | RightFlex        |
 * | OpenMenu, Branding, CreateDocument, Search | Status, Presence |
 * ```
 *
 * SMALL screens:
 * ```
 * | LeftFlex                 | CenterBox | RightFlex        |
 * | OpenMenu, CreateDocument | Branding  | Presence, Search |
 * ```
 */

const newDocumentOptions = getNewDocumentOptions()

export const Navbar = memo(function Navbar(props: NavbarProps) {
  const {
    createMenuIsOpen,
    isTemplatePermissionsLoading,
    onCreateButtonClick,
    onSearchFullscreenOpen,
    onToggleMenu,
    onUserLogout,
    searchFullscreenOpen,
    setCreateButtonElement,
    templatePermissions,
  } = props

  const [
    searchFullscreenOpenButtonElement,
    setSearchOpenButtonElement,
  ] = useState<HTMLButtonElement | null>(null)
  const {value: currentUser} = useCurrentUser()
  const mediaIndex = useMediaIndex()
  const router = useDefaultLayoutRouter()

  const {projectId} = versionedClient.config()

  const noDocumentOptions = newDocumentOptions?.length === 0

  const canCreateSome = useMemo(() => {
    if (isTemplatePermissionsLoading) return false

    return templatePermissions.some((permission) => permission.granted)
  }, [templatePermissions, isTemplatePermissionsLoading])

  const rootState = useMemo(
    () => (HAS_SPACES && router.state.space ? {space: router.state.space} : {}),
    [router.state.space]
  )

  const shouldRender = useMemo(
    () => ({
      brandingCenter: mediaIndex <= 1,
      changelog: mediaIndex > 1,
      collapsedPresenceMenu: mediaIndex <= 1,
      hints: mediaIndex > 1 && sidecar && sidecar.isSidecarEnabled && sidecar.isSidecarEnabled(),
      loginStatus: mediaIndex > 1,
      searchFullscreen: mediaIndex <= 1,
      spaces: HAS_SPACES && mediaIndex >= 3,
      tools: mediaIndex >= 3,
    }),
    [mediaIndex]
  )

  // Diable fullscreen search and re-focus search button
  const handleSearchFullscreenClose = useCallback(() => {
    onSearchFullscreenOpen(false)
    searchFullscreenOpenButtonElement?.focus()
  }, [onSearchFullscreenOpen, searchFullscreenOpenButtonElement])

  // Enable fullscreen search (passthrough)
  const handleSearchFullscreenOpen = useCallback(() => {
    onSearchFullscreenOpen(true)
  }, [onSearchFullscreenOpen])

  // Disable fullscreen search on media query change (if already open)
  useEffect(() => {
    if (onSearchFullscreenOpen && !shouldRender.searchFullscreen) {
      onSearchFullscreenOpen(false)
    }
  }, [onSearchFullscreenOpen, shouldRender.searchFullscreen])

  const LinkComponent = useCallback(
    (linkProps) => {
      return <StateLink state={rootState} {...linkProps} />
    },
    [rootState]
  )

  const createTooltipContent = useMemo(() => {
    if (noDocumentOptions) {
      return <Text size={1}>You need a schema to create a new document</Text>
    }

    if (canCreateSome) {
      return <Text size={1}>Create new document</Text>
    }

    return (
      <InsufficientPermissionsMessage
        currentUser={currentUser}
        operationLabel="create any document"
      />
    )
  }, [canCreateSome, currentUser, noDocumentOptions])

  return (
    <Root $onSearchFullscreenOpen={searchFullscreenOpen} data-ui="Navbar" padding={2} scheme="dark">
      <Flex align="center" justify="space-between">
        <LeftFlex flex={shouldRender.brandingCenter ? undefined : 1} align="center">
          {!shouldRender.tools && (
            <SpacingBox marginRight={1}>
              <Button
                aria-label="Open menu"
                icon={MenuIcon}
                mode="bleed"
                onClick={onToggleMenu}
                title="Open menu"
              />
            </SpacingBox>
          )}

          {!shouldRender.brandingCenter && (
            <SpacingBox marginRight={1}>
              <BrandingButton forwardedAs={LinkComponent} mode="bleed">
                <Branding projectName={config && config.project.name} />
              </BrandingButton>
            </SpacingBox>
          )}

          {shouldRender.spaces && (
            <Flex marginRight={2}>
              <DatasetSelect />
            </Flex>
          )}

          <LegacyLayerProvider zOffset="navbarPopover">
            <Tooltip portal scheme="light" content={<Box padding={2}>{createTooltipContent}</Box>}>
              <SpacingBox marginRight={shouldRender.brandingCenter ? undefined : 2}>
                <Button
                  aria-label="Create new document"
                  data-testid="default-layout-global-create-button"
                  disabled={!canCreateSome}
                  icon={ComposeIcon}
                  mode="bleed"
                  onClick={onCreateButtonClick}
                  ref={setCreateButtonElement}
                  selected={createMenuIsOpen}
                />
              </SpacingBox>
            </Tooltip>
          </LegacyLayerProvider>

          <LegacyLayerProvider zOffset="navbarPopover">
            <SearchProvider currentUser={currentUser}>
              {shouldRender.searchFullscreen && (
                <SearchDialog
                  onClose={handleSearchFullscreenClose}
                  onOpen={handleSearchFullscreenOpen}
                  open={searchFullscreenOpen}
                />
              )}
              {!shouldRender.searchFullscreen && <SearchField />}
            </SearchProvider>
          </LegacyLayerProvider>

          {shouldRender.tools && (
            <Card borderRight flex={1} marginX={2} overflow="visible" paddingRight={1}>
              <LegacyLayerProvider zOffset="navbarPopover">
                <ToolMenu direction="horizontal" tools={tools} />
              </LegacyLayerProvider>
            </Card>
          )}
        </LeftFlex>

        {shouldRender.brandingCenter && (
          <CenterBox marginX={1}>
            <BrandingButton forwardedAs={LinkComponent} mode="bleed">
              <Branding projectName={config && config.project.name} />
            </BrandingButton>
          </CenterBox>
        )}

        <RightFlex align="center">
          {shouldRender.changelog && (
            <SpacingBox marginRight={1}>
              <ChangelogContainer />
            </SpacingBox>
          )}

          {shouldRender.hints && (
            <Box marginRight={1}>{sidecar && createElement(sidecar.SidecarToggleButton)}</Box>
          )}

          <LegacyLayerProvider zOffset="navbarPopover">
            <SpacingBox marginRight={1}>
              <PresenceMenu
                collapse={shouldRender.collapsedPresenceMenu}
                maxAvatars={4}
                projectId={projectId}
              />
            </SpacingBox>
          </LegacyLayerProvider>

          {shouldRender.tools && (
            <LegacyLayerProvider zOffset="navbarPopover">
              <Flex align="center">
                <LoginStatus
                  currentUser={currentUser}
                  onLogout={onUserLogout}
                  projectId={projectId}
                />
              </Flex>
            </LegacyLayerProvider>
          )}

          {shouldRender.searchFullscreen && (
            <Button
              aria-label="Open search"
              icon={SearchIcon}
              mode="bleed"
              onClick={handleSearchFullscreenOpen}
              ref={setSearchOpenButtonElement}
            />
          )}
        </RightFlex>
      </Flex>
    </Root>
  )
})
