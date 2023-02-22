import {
  PortalProvider,
  useToast,
  useMediaIndex,
  Flex,
  Text,
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuDivider,
} from '@sanity/ui'
import React, {memo, Fragment, useState, useEffect, useCallback} from 'react'
import styled from 'styled-components'
import isHotkey from 'is-hotkey'
import {
  AddIcon,
  BinaryDocumentIcon,
  ChevronRightIcon,
  CloseIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  PublishIcon,
  ResetIcon,
  RevertIcon,
  SearchIcon,
  TransferIcon,
  TrashIcon,
  UnpublishIcon,
} from '@sanity/icons'
import {LOADING_PANE} from '../../constants'
import {LoadingPane, DeskToolPane} from '../../panes'
import {useResolvedPanes} from '../../structureResolvers'
import {PaneNode} from '../../types'
import {PaneLayout} from '../pane'
import {useDeskTool} from '../../useDeskTool'
import {NoDocumentTypesScreen} from './NoDocumentTypesScreen'
import {Link, useRouter} from 'sanity/router'
import {useSchema, _isCustomDocumentTypeDefinition} from 'sanity'

interface DeskToolProps {
  onPaneChange: (panes: Array<PaneNode | typeof LOADING_PANE>) => void
}

const StyledPaneLayout = styled(PaneLayout)`
  height: calc(100% - 52px);
  min-width: 320px;
`

const Breadcrumbs = styled(Flex)`
  // border-bottom: solid 1px var(--card-border-color);
`

const isSaveHotkey = isHotkey('mod+s')

/**
 * @internal
 */
export const DeskTool = memo(function DeskTool({onPaneChange}: DeskToolProps) {
  const {navigate} = useRouter()
  const {push: pushToast} = useToast()
  const schema = useSchema()
  const mediaIndex = useMediaIndex()
  const {layoutCollapsed, setLayoutCollapsed} = useDeskTool()
  const {paneDataItems, resolvedPanes, routerPanes} = useResolvedPanes()

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const handleRootCollapse = useCallback(() => setLayoutCollapsed(true), [setLayoutCollapsed])
  const handleRootExpand = useCallback(() => setLayoutCollapsed(false), [setLayoutCollapsed])

  useEffect(() => {
    // we check for length before emitting here to skip the initial empty array
    // state from the `useResolvedPanes` hook. there should always be a root
    // pane emitted on subsequent emissions
    if (resolvedPanes.length) {
      onPaneChange(resolvedPanes)
    }
  }, [onPaneChange, resolvedPanes])

  // The pane layout is "collapsed" on small screens, and only shows 1 pane at a time.
  // Remove pane siblings (i.e. split panes) as the pane layout collapses.
  useEffect(() => {
    if (mediaIndex > 1 || !layoutCollapsed) return
    const hasSiblings = routerPanes.some((group) => group.length > 1)

    if (!hasSiblings) return
    const withoutSiblings = routerPanes.map((group) => [group[0]])

    navigate({panes: withoutSiblings}, {replace: true})
  }, [mediaIndex, navigate, layoutCollapsed, routerPanes])

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

  // const breadcrumbDataItems = paneDataItems.filter((item) => item.pane.type != 'document')

  const collapsedPaneDataItems = paneDataItems.some(
    (item) => item.pane.type && item.pane.type === 'document'
  )
    ? paneDataItems.slice(-2)
    : paneDataItems

  return (
    <PortalProvider element={portalElement || null}>
      <Breadcrumbs align="center" justify="space-between">
        <Flex gap={1} padding={3} align="center">
          {paneDataItems.map(
            (
              {
                active,
                childItemId,
                groupIndex,
                itemId,
                key: paneKey,
                pane,
                index: paneIndex,
                params: paneParams,
                path,
                payload,
                siblingIndex,
                selected,
              },
              index
            ) => (
              <Flex gap={2} key={`${pane.type}-${paneIndex}`} align="center">
                <Button
                  as={Link}
                  href={path.replace('root;', '')}
                  text={pane.title || 'Document title'}
                  padding={2}
                  mode="bleed"
                />
                {index === paneDataItems.length - 1 ? (
                  ' '
                ) : (
                  <Text muted>
                    <ChevronRightIcon />
                  </Text>
                )}
              </Flex>
            )
          )}
        </Flex>
        {paneDataItems &&
          paneDataItems.length > 0 &&
          paneDataItems[paneDataItems.length - 1].pane.type === 'documentList' && (
            <Flex gap={2} padding={2}>
              <Button padding={3} icon={SearchIcon} mode="bleed" />
              <Button padding={3} icon={AddIcon} text="Create new" mode="ghost" />
            </Flex>
          )}
        {paneDataItems &&
          paneDataItems.length > 0 &&
          paneDataItems[paneDataItems.length - 1].pane.type === 'document' && (
            <Flex gap={2} padding={2}>
              <Button padding={3} icon={PublishIcon} text="Publish" tone="positive" />
              <MenuButton
                button={<Button padding={3} icon={EllipsisVerticalIcon} mode="bleed" />}
                id="menu-button-example"
                menu={
                  <Menu>
                    <MenuItem icon={TransferIcon} text="Review changes" />
                    <MenuItem icon={BinaryDocumentIcon} text="Inspect output data" />
                    <MenuDivider />
                    <MenuItem icon={UnpublishIcon} tone="critical" text="Unpublish" />
                    <MenuItem icon={ResetIcon} tone="critical" text="Discard changes" />
                    <MenuItem icon={CopyIcon} text="Duplicate" />
                    <MenuItem icon={TrashIcon} tone="critical" text="Delete" />
                  </Menu>
                }
                popover={{portal: true, placement: 'bottom'}}
              />

              <Button
                as={Link}
                padding={3}
                icon={CloseIcon}
                mode="bleed"
                href={paneDataItems[paneDataItems.length - 2].path.replace('root;', '')}
              />
            </Flex>
          )}
      </Breadcrumbs>
      <StyledPaneLayout
        flex={1}
        height={layoutCollapsed ? undefined : 'fill'}
        minWidth={512}
        onCollapse={handleRootCollapse}
        onExpand={handleRootExpand}
      >
        {collapsedPaneDataItems.map(
          (
            {
              active,
              childItemId,
              groupIndex,
              itemId,
              key: paneKey,
              pane,
              index: paneIndex,
              params: paneParams,
              path,
              payload,
              siblingIndex,
              selected,
            },
            index
          ) => (
            <Fragment key={`${pane === LOADING_PANE ? 'loading' : pane.type}-${paneIndex}`}>
              {pane === LOADING_PANE ? (
                <LoadingPane paneKey={paneKey} path={path} selected={selected} />
              ) : (
                <DeskToolPane
                  fullWidth={
                    index === collapsedPaneDataItems.length - 2 && pane.type === 'documentList'
                  }
                  active={active}
                  groupIndex={groupIndex}
                  index={paneIndex}
                  pane={pane}
                  childItemId={childItemId}
                  itemId={itemId}
                  paneKey={paneKey}
                  params={paneParams}
                  payload={payload}
                  selected={selected}
                  siblingIndex={siblingIndex}
                />
              )}
            </Fragment>
          )
        )}
      </StyledPaneLayout>
      <div data-portal="" ref={setPortalElement} />
    </PortalProvider>
  )
})
