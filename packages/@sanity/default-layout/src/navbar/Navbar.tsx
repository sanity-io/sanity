// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React, {createElement, useCallback, useState, useEffect, useMemo} from 'react'
import {SearchIcon, MenuIcon, ComposeIcon, CloseIcon} from '@sanity/icons'
import {Button, Card, Tooltip, useMediaIndex, Text, Box, Flex, useGlobalKeyDown} from '@sanity/ui'
import {InsufficientPermissionsMessage, LegacyLayerProvider} from '@sanity/base/components'
import {StateLink} from '@sanity/base/router'
// eslint-disable-next-line camelcase
import {unstable_useCanCreateAnyOf, useCurrentUser} from '@sanity/base/hooks'
import config from 'config:sanity'
import * as sidecar from 'part:@sanity/default-layout/sidecar?'
import styled from 'styled-components'
import {HAS_SPACES} from '../util/spaces'
import {Router, Tool} from '../types'
import {DatasetSelect} from '../datasetSelect'
import Branding from './branding/Branding'
import SanityStatusContainer from './studioStatus/SanityStatusContainer'
import {PresenceMenu, LoginStatus, SearchField, ToolMenuCollapse} from '.'

interface Props {
  createMenuIsOpen: boolean
  documentTypes: string[]
  onCreateButtonClick: () => void
  onToggleMenu: () => void
  onUserLogout: () => void
  router: Router
  searchIsOpen: (open: boolean) => void
  searchPortalElement: HTMLDivElement | null
  tools: Tool[]
}

const Root = styled(Card)<{$searchIsOpen: boolean}>`
  top: 0;
  position: ${({$searchIsOpen}) => ($searchIsOpen ? 'sticky' : 'relative')};
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

const SearchCard = styled(Card)<{$fullScreen: boolean}>`
  min-width: 253px;
  max-width: ${({$fullScreen}) => ($fullScreen ? undefined : '350px')};
  z-index: 1;
  position: ${({$fullScreen}) => ($fullScreen ? 'absolute' : undefined)};
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`

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

export function Navbar(props: Props) {
  const {
    createMenuIsOpen,
    documentTypes,
    onCreateButtonClick,
    onToggleMenu,
    onUserLogout,
    router,
    searchIsOpen,
    searchPortalElement,
    tools,
  } = props

  const [searchOpen, setSearchOpen] = useState<boolean>(false)
  const [inputElement, setInputElement] = useState<HTMLInputElement | null>(null)
  const [searchButtonElement, setSearchButtonElement] = useState<HTMLButtonElement | null>(null)
  const {value: currentUser} = useCurrentUser()
  const createAnyPermission = unstable_useCanCreateAnyOf(documentTypes)
  const mediaIndex = useMediaIndex()
  const rootState = useMemo(
    () => (HAS_SPACES && router.state.space ? {space: router.state.space} : {}),
    [router.state.space]
  )

  const shouldRender = {
    brandingCenter: mediaIndex <= 1,
    collapsedPresenceMenu: mediaIndex <= 1,
    hints: mediaIndex > 1 && sidecar && sidecar.isSidecarEnabled && sidecar.isSidecarEnabled(),
    loginStatus: mediaIndex > 1,
    searchFullscreen: mediaIndex <= 1,
    spaces: HAS_SPACES && mediaIndex >= 3,
    statusContainer: mediaIndex > 1,
    tools: mediaIndex >= 3,
  }

  useGlobalKeyDown((e) => {
    if (e.key === 'Escape' && searchOpen) {
      setSearchOpen(false)
      searchButtonElement?.focus()
    }
  })

  const handleToggleSearchOpen = useCallback(() => {
    setSearchOpen((prev) => {
      if (prev) {
        searchButtonElement?.focus()
      }

      return !prev
    })
  }, [searchButtonElement])

  useEffect(() => {
    if (searchIsOpen && !shouldRender.searchFullscreen) {
      setSearchOpen(false)
      searchIsOpen(false)
    }
  }, [searchIsOpen, shouldRender.searchFullscreen])

  useEffect(() => {
    searchIsOpen(searchOpen)

    if (searchOpen) {
      inputElement?.focus()
    }
  }, [inputElement, searchButtonElement, searchIsOpen, searchOpen])

  const LinkComponent = useCallback(
    (linkProps) => {
      return <StateLink state={rootState} {...linkProps} />
    },
    [rootState]
  )

  return (
    <Root padding={2} scheme="dark" $searchIsOpen={searchOpen}>
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
            <Tooltip
              portal
              scheme="light"
              content={
                <Box padding={2}>
                  {createAnyPermission.granted ? (
                    <Text size={1} muted>
                      Create new document
                    </Text>
                  ) : (
                    <InsufficientPermissionsMessage
                      currentUser={currentUser}
                      operationLabel="create any document"
                    />
                  )}
                </Box>
              }
            >
              <SpacingBox marginRight={shouldRender.brandingCenter ? undefined : 2}>
                <Button
                  aria-label="Create new document"
                  data-testid="default-layout-global-create-button"
                  icon={ComposeIcon}
                  mode="bleed"
                  onClick={onCreateButtonClick}
                  disabled={!createAnyPermission.granted}
                  selected={createMenuIsOpen}
                />
              </SpacingBox>
            </Tooltip>
          </LegacyLayerProvider>

          <LegacyLayerProvider zOffset="navbarPopover">
            {(searchOpen || !shouldRender.searchFullscreen) && (
              <SearchCard
                flex={1}
                padding={shouldRender.searchFullscreen ? 2 : undefined}
                $fullScreen={shouldRender.searchFullscreen}
              >
                <Flex flex={1}>
                  <Box flex={1} marginRight={shouldRender.tools ? undefined : 2}>
                    <SearchField
                      onSearchItemClick={handleToggleSearchOpen}
                      portalElement={searchPortalElement}
                      inputElement={setInputElement}
                      fullScreen={shouldRender.searchFullscreen}
                    />
                  </Box>
                  {shouldRender.searchFullscreen && (
                    <Button
                      icon={CloseIcon}
                      aria-label="Close search"
                      onClick={handleToggleSearchOpen}
                      mode="bleed"
                    />
                  )}
                </Flex>
              </SearchCard>
            )}
          </LegacyLayerProvider>

          {shouldRender.tools && (
            <Card borderRight paddingRight={1} flex={1} overflow="visible" marginX={2}>
              <LegacyLayerProvider zOffset="navbarPopover">
                <ToolMenuCollapse tools={tools} router={router} />
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
          {shouldRender.statusContainer && (
            <SpacingBox marginRight={1}>
              <SanityStatusContainer />
            </SpacingBox>
          )}

          {shouldRender.hints && (
            <Box marginRight={1}>{sidecar && createElement(sidecar.SidecarToggleButton)}</Box>
          )}

          <LegacyLayerProvider zOffset="navbarPopover">
            <SpacingBox marginRight={1}>
              <PresenceMenu collapse={shouldRender.collapsedPresenceMenu} maxAvatars={4} />
            </SpacingBox>
          </LegacyLayerProvider>

          {shouldRender.tools && (
            <LegacyLayerProvider zOffset="navbarPopover">
              <Flex align="center">
                <LoginStatus onLogout={onUserLogout} />
              </Flex>
            </LegacyLayerProvider>
          )}

          {shouldRender.searchFullscreen && (
            <Button
              aria-label="Open search"
              onClick={handleToggleSearchOpen}
              icon={SearchIcon}
              mode="bleed"
              ref={setSearchButtonElement}
            />
          )}
        </RightFlex>
      </Flex>
    </Root>
  )
}
