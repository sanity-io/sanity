import {type Path} from '@sanity/types'
import {Card, Container, Flex} from '@sanity/ui'
import {memo, type ReactNode, useCallback, useRef, useState} from 'react'

import {PresenceOverlay} from '../../../../../presence/overlay/PresenceOverlay'
import {VirtualizerScrollInstanceProvider} from '../../../../inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {type DialogItem} from '../../types'
import {DialogBreadcrumbs} from '../breadcrumbs/DialogBreadcrumbs'
import {FixedHeightFlex} from './styles'
import {TreeEditingLayoutSidebar} from './TreeEditingLayoutSidebar'

const PRESENCE_MARGINS: [number, number, number, number] = [0, 0, 1, 0]

interface TreeEditingLayoutProps {
  breadcrumbs: DialogItem[]
  children: ReactNode
  footer?: ReactNode
  items: DialogItem[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
  setScrollElement?: (ref: HTMLDivElement | null) => void
  title: string
  siblings: Map<string, {count: number; index: number}>
}

/**
 * This component is not currently used, but it might be useful to keep in the future if we want to return back to a solution revolving around a tree.
 * For now I think it's best to keep it
 */
export const TreeEditingLayout = memo(function TreeEditingLayout(
  props: TreeEditingLayoutProps,
): React.JSX.Element {
  const {
    breadcrumbs,
    children,
    footer,
    items,
    onPathSelect,
    selectedPath,
    setScrollElement: setParentScrollElement,
    title,
    siblings,
  } = props
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null)
  const containerElementRef = useRef<HTMLDivElement | null>(null)

  const [open, setOpen] = useState<boolean>(false)

  const toggleOpen = useCallback(() => setOpen((v) => !v), [])

  const handleSetScrollElementRef = useCallback(
    (el: HTMLDivElement | null) => {
      setScrollElement(el)
      setParentScrollElement?.(el)
    },
    [setParentScrollElement],
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
            <DialogBreadcrumbs
              items={breadcrumbs}
              onPathSelect={onPathSelect}
              selectedPath={selectedPath}
              siblings={siblings}
            />
          </Flex>
        </FixedHeightFlex>

        <Card flex={1} id="tree-editing-form" overflow="auto" ref={handleSetScrollElementRef}>
          {children && (
            <VirtualizerScrollInstanceProvider
              containerElement={containerElementRef}
              scrollElement={scrollElement}
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
