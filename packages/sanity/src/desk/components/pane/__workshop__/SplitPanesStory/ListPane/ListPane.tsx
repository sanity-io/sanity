import {ArrowLeftIcon, ChevronRightIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {usePaneLayout} from '../../../usePaneLayout'
import {Pane} from '../../../Pane'
import {PaneContent} from '../../../PaneContent'
import {PaneHeader} from '../../../PaneHeader'
import {ListPaneNode} from '../types'
import {ContextMenuButton} from 'sanity'
import {Button} from 'sanity/_internal-ui-components'

export function ListPane(props: {
  active: boolean
  childId?: string
  index: number
  node: ListPaneNode
  setPath: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const {active, childId, index, node, setPath} = props
  const {collapsed: layoutCollapsed} = usePaneLayout()

  const handleBackClick = useCallback(() => {
    setPath((p) => p.slice(0, index))
  }, [index, setPath])

  return (
    <Pane currentMaxWidth={350} flex={1} id={String(index)} minWidth={320} maxWidth={640}>
      <PaneHeader
        actions={<ContextMenuButton />}
        backButton={
          index > 0 &&
          layoutCollapsed && (
            <Button
              icon={ArrowLeftIcon}
              mode="bleed"
              onClick={handleBackClick}
              tooltipProps={{content: 'Back'}}
            />
          )
        }
        title={node.title}
      />

      <PaneContent>
        <Stack padding={2} space={1}>
          {node.items.map((item) => (
            <Card
              as="button"
              key={item.id}
              onClick={() => setPath((p) => p.slice(0, index + 1).concat([item.id]))}
              padding={3}
              radius={2}
              pressed={!active && childId === item.id}
              selected={active && childId === item.id}
            >
              <Flex>
                <Box flex={1}>
                  <Text>{item.title}</Text>
                </Box>
                <Box>
                  <Text>
                    <ChevronRightIcon />
                  </Text>
                </Box>
              </Flex>
            </Card>
          ))}
        </Stack>
      </PaneContent>
    </Pane>
  )
}
