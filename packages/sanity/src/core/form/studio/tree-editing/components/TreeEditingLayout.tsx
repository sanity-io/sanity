/* eslint-disable i18next/no-literal-string */
import {PanelLeftIcon} from '@sanity/icons'
import {Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {Fragment, memo, type ReactNode, useCallback, useRef, useState} from 'react'
import {type Path, VirtualizerScrollInstanceProvider} from 'sanity'
import styled from 'styled-components'

import {Button} from '../../../../../ui-components'
import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../types'
import {Resizable} from './resizer'
import {TreeEditingBreadCrumbs} from './TreeEditingBreadCrumbs'
import {TreeEditingMenu} from './TreeEditingMenu'

const FixedHeightFlex = styled(Flex).attrs({padding: 2, align: 'center', sizing: 'border'})`
  height: 40px;
  min-height: 40px;
`

const SidebarCard = styled(Card)`
  flex-direction: column;
`

const SidebarStack = styled(Stack)`
  overflow-x: hidden;
`

interface SidebarProps {
  items: TreeEditingMenuItem[]
  onOpenToggle: () => void
  onPathSelect: (path: Path) => void
  open: boolean
  selectedPath: Path
  title: string
}

const Sidebar = memo(function Sidebar(props: SidebarProps) {
  const {items, onPathSelect, selectedPath, onOpenToggle, open, title} = props

  const ConditionalResizer = open ? Resizable : Fragment

  return (
    <ConditionalResizer maxWidth={450} minWidth={150} initialWidth={250}>
      <SidebarCard
        borderRight={!open}
        data-ui="SidebarCard"
        display="flex"
        height="fill"
        overflow="hidden"
        tone="transparent"
      >
        <FixedHeightFlex align="center" gap={2}>
          <Button
            icon={PanelLeftIcon}
            mode="bleed"
            onClick={onOpenToggle}
            selected={open}
            tooltipProps={{content: open ? 'Close sidebar' : 'Open sidebar'}}
          />

          {open && (
            <Flex>
              <Text size={1} muted weight="medium" textOverflow="ellipsis">
                {title}
              </Text>
            </Flex>
          )}
        </FixedHeightFlex>

        {open && (
          <SidebarStack overflow="auto" padding={3} sizing="border">
            <TreeEditingMenu
              items={items}
              onPathSelect={onPathSelect}
              selectedPath={selectedPath}
            />
          </SidebarStack>
        )}
      </SidebarCard>
    </ConditionalResizer>
  )
})

interface TreeEditingLayoutProps {
  breadcrumbs: TreeEditingBreadcrumb[]
  children: ReactNode
  items: TreeEditingMenuItem[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
  title: string
}

export const TreeEditingLayout = memo(function TreeEditingLayout(
  props: TreeEditingLayoutProps,
): JSX.Element {
  const {breadcrumbs, children, items, selectedPath, onPathSelect, title} = props
  const scrollElementRef = useRef<HTMLDivElement | null>(null)
  const containerElementRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState<boolean>(true)

  const toggleOpen = useCallback(() => setOpen((v) => !v), [])

  return (
    <Flex height="fill" overflow="hidden">
      <Sidebar
        items={items}
        onOpenToggle={toggleOpen}
        onPathSelect={onPathSelect}
        open={open}
        selectedPath={selectedPath}
        title={title}
      />

      <Flex direction="column" flex={1} overflow="hidden">
        <FixedHeightFlex align="center" sizing="border" gap={2} paddingX={4}>
          <TreeEditingBreadCrumbs items={breadcrumbs} onPathSelect={onPathSelect} />
        </FixedHeightFlex>

        <Card
          flex={1}
          id="tree-editing-form"
          overflow="auto"
          paddingX={3}
          paddingY={5}
          ref={scrollElementRef}
          sizing="border"
        >
          {children && (
            <Container width={1} ref={containerElementRef}>
              <VirtualizerScrollInstanceProvider
                containerElement={containerElementRef}
                scrollElement={scrollElementRef.current}
              >
                {children}
              </VirtualizerScrollInstanceProvider>
            </Container>
          )}
        </Card>
      </Flex>
    </Flex>
  )
})
