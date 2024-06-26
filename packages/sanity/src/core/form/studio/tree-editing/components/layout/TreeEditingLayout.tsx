import {Card, Container, Flex} from '@sanity/ui'
import {memo, type ReactNode, useCallback, useRef, useState} from 'react'
import {type Path, PresenceOverlay, VirtualizerScrollInstanceProvider} from 'sanity'

import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../../types'
import {TreeEditingBreadcrumbs} from '../breadcrumbs'
import {FixedHeightFlex} from './styles'
import {TreeEditingLayoutSidebar} from './TreeEditingLayoutSidebar'

const PRESENCE_MARGINS: [number, number, number, number] = [0, 0, 1, 0]

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
      <TreeEditingLayoutSidebar
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
