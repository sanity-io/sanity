/* eslint-disable i18next/no-literal-string */
import {PanelLeftIcon} from '@sanity/icons'
import {Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useState} from 'react'
import {type Path} from 'sanity'
import styled from 'styled-components'

import {Button} from '../../../../../ui-components'
import {type TreeEditingMenuItem} from '../types'
import {TreeEditingMenu} from './TreeEditingMenu'

const FixedHeightFlex = styled(Flex).attrs({padding: 2, align: 'center', sizing: 'border'})`
  height: 40px;
`

const SidebarCard = styled(Card)`
  flex-direction: column;
`

const SidebarStack = styled(Stack)`
  width: 250px;
`

interface TreeEditingLayoutProps {
  items: TreeEditingMenuItem[]
  children: ReactNode
  onPathSelect: (path: Path) => void
  selectedPath: Path
}

export function TreeEditingLayout(props: TreeEditingLayoutProps) {
  const {children, items, selectedPath, onPathSelect} = props

  const [open, setOpen] = useState<boolean>(true)

  const toggleOpen = useCallback(() => setOpen((v) => !v), [])

  return (
    <Flex height="fill" overflow="hidden">
      <SidebarCard borderRight display="flex" tone="transparent">
        <FixedHeightFlex align="center" gap={2}>
          <Button
            icon={PanelLeftIcon}
            mode="bleed"
            onClick={toggleOpen}
            selected={open}
            tooltipProps={{content: open ? 'Close sidebar' : 'Open sidebar'}}
          />

          {open && (
            <Text size={1} weight="medium">
              Edit tree
            </Text>
          )}
        </FixedHeightFlex>

        {open && (
          <SidebarStack flex={1} overflow="auto" padding={3} sizing="border">
            <TreeEditingMenu
              items={items}
              onPathSelect={onPathSelect}
              selectedPath={selectedPath}
            />
          </SidebarStack>
        )}
      </SidebarCard>

      <Flex direction="column" flex={1} overflow="hidden">
        <FixedHeightFlex align="center" sizing="border" paddingX={4}>
          <Text size={1}>{`Breadcrumbs > Here`}</Text>
        </FixedHeightFlex>

        <Card flex={1} paddingX={3} paddingY={5} sizing="border" overflow="auto">
          <Container width={1}>{children}</Container>
        </Card>
      </Flex>
    </Flex>
  )
}
