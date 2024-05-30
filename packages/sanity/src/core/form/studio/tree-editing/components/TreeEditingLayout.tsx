import {PanelLeftIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {AnimatePresence, motion, type Variants} from 'framer-motion'
import {Fragment, memo, type ReactNode, useCallback, useMemo, useRef, useState} from 'react'
import {type Path, PresenceOverlay, VirtualizerScrollInstanceProvider} from 'sanity'
import styled from 'styled-components'

import {Button} from '../../../../../ui-components'
import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../types'
import {TreeEditingBreadcrumbs} from './breadcrumbs'
import {Resizable} from './resizer'
import {TreeEditingSearch} from './search'
import {TreeEditingMenu} from './TreeEditingMenu'

const PRESENCE_MARGINS: [number, number, number, number] = [0, 0, 1, 0]

const ANIMATION_VARIANTS: Variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
}

const FixedHeightFlex = styled(Flex).attrs({padding: 2, align: 'center', sizing: 'border'})`
  height: 40px;
  min-height: 40px;
`

const SidebarCard = styled(Card)`
  flex-direction: column;
`

const SidebarStack = styled(motion(Stack))`
  overflow-x: hidden;
`

const SearchStack = styled(Stack)`
  min-height: max-content;
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

  // todo: localize
  const tooltipProps = useMemo(() => ({content: open ? 'Close sidebar' : 'Open sidebar'}), [open])

  return (
    <ConditionalResizer maxWidth={450} minWidth={150} initialWidth={250}>
      <SidebarCard
        borderRight={!open}
        data-testid="tree-editing-sidebar"
        data-ui="SidebarCard"
        display="flex"
        height="fill"
        overflow="hidden"
        tone="transparent"
      >
        <FixedHeightFlex align="center" gap={2}>
          <Button
            data-testid="tree-editing-sidebar-toggle"
            icon={PanelLeftIcon}
            mode="bleed"
            onClick={onOpenToggle}
            selected={open}
            tooltipProps={tooltipProps}
          />

          {open && (
            <Box flex={1}>
              <Text size={1} muted weight="medium" textOverflow="ellipsis">
                {title}
              </Text>
            </Box>
          )}
        </FixedHeightFlex>

        {open && (
          <SearchStack padding={2} sizing="border">
            <TreeEditingSearch items={items} onPathSelect={onPathSelect} />
          </SearchStack>
        )}

        <AnimatePresence mode="wait">
          {open && (
            <SidebarStack
              animate="animate"
              exit="exit"
              initial="initial"
              overflow="auto"
              padding={3}
              sizing="border"
              variants={ANIMATION_VARIANTS}
            >
              <TreeEditingMenu
                items={items}
                onPathSelect={onPathSelect}
                selectedPath={selectedPath}
              />
            </SidebarStack>
          )}
        </AnimatePresence>
      </SidebarCard>
    </ConditionalResizer>
  )
})

interface TreeEditingLayoutProps {
  breadcrumbs: TreeEditingBreadcrumb[]
  children: ReactNode
  footer?: ReactNode
  items: TreeEditingMenuItem[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
  setScrollElement?: (ref: HTMLDivElement | null) => void
  title: string
}

export const TreeEditingLayout = memo(function TreeEditingLayout(
  props: TreeEditingLayoutProps,
): JSX.Element {
  const {
    breadcrumbs,
    children,
    footer,
    items,
    onPathSelect,
    selectedPath,
    setScrollElement,
    title,
  } = props
  const scrollElementRef = useRef<HTMLDivElement | null>(null)
  const containerElementRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState<boolean>(false)

  const toggleOpen = useCallback(() => setOpen((v) => !v), [])

  const handleSetScrollElementRef = useCallback(
    (el: HTMLDivElement | null) => {
      scrollElementRef.current = el

      setScrollElement?.(el)
    },
    [setScrollElement],
  )

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
          <Flex flex={1}>
            <TreeEditingBreadcrumbs
              items={breadcrumbs}
              onPathSelect={onPathSelect}
              selectedPath={selectedPath}
            />
          </Flex>
        </FixedHeightFlex>

        <Card flex={1} id="tree-editing-form" overflow="auto" ref={handleSetScrollElementRef}>
          {children && (
            <VirtualizerScrollInstanceProvider
              containerElement={containerElementRef}
              scrollElement={scrollElementRef.current}
            >
              <Container
                width={1}
                ref={containerElementRef}
                paddingX={5}
                paddingY={5}
                sizing="border"
              >
                <PresenceOverlay margins={PRESENCE_MARGINS}>{children}</PresenceOverlay>
              </Container>
            </VirtualizerScrollInstanceProvider>
          )}
        </Card>

        {footer}
      </Flex>
    </Flex>
  )
})
