import {Card, Container, Flex} from '@sanity/ui'
import {memo, type ReactNode, useCallback, useRef} from 'react'
import {type Path, PresenceOverlay, VirtualizerScrollInstanceProvider} from 'sanity'

import {type ArrayEditingBreadcrumb} from '../../types'
import {ArrayEditingBreadcrumbs} from '../breadcrumbs'
import {FixedHeightFlex} from './styles'

const PRESENCE_MARGINS: [number, number, number, number] = [0, 0, 1, 0]

interface ArrayEditingLayoutProps {
  breadcrumbs: ArrayEditingBreadcrumb[]
  children: ReactNode
  footer?: ReactNode
  onPathSelect: (path: Path) => void
  selectedPath: Path
  setScrollElement?: (ref: HTMLDivElement | null) => void
}

export const ArrayEditingLayout = memo(function ArrayEditingLayout(
  props: ArrayEditingLayoutProps,
): JSX.Element {
  const {breadcrumbs, children, footer, onPathSelect, selectedPath, setScrollElement} = props
  const scrollElementRef = useRef<HTMLDivElement | null>(null)
  const containerElementRef = useRef<HTMLDivElement | null>(null)

  const handleSetScrollElementRef = useCallback(
    (el: HTMLDivElement | null) => {
      scrollElementRef.current = el

      setScrollElement?.(el)
    },
    [setScrollElement],
  )

  return (
    <Flex height="fill" overflow="hidden">
      <Flex direction="column" flex={1} overflow="hidden">
        <FixedHeightFlex align="center" sizing="border" gap={2} paddingX={4}>
          <Flex flex={1}>
            <ArrayEditingBreadcrumbs
              items={breadcrumbs}
              onPathSelect={onPathSelect}
              selectedPath={selectedPath}
            />
          </Flex>
        </FixedHeightFlex>

        <Card flex={1} id="array-editing-form" overflow="auto" ref={handleSetScrollElementRef}>
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
