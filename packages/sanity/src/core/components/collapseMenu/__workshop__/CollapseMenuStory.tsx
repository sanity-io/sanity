import {EllipsisVerticalIcon, IceCreamIcon} from '@sanity/icons'
import {Button, Card, Flex} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React from 'react'
import {CollapseMenu, CollapseMenuButton} from '../'

const GAP_OPTIONS = {'0': 0, '1': 1, '2': 2, '3': 3, '4': 4}

export default function CollapseMenuStory() {
  const collapsed = useBoolean('Collapsed', false)
  const gap = useSelect('Gap', GAP_OPTIONS, 1)
  const collapseText = useBoolean('Collapse text', true)

  return (
    <Flex align="center" height="fill" justify="center" padding={2}>
      <Card shadow={1} radius={3} padding={1}>
        <CollapseMenu
          gap={gap}
          collapsed={collapsed}
          collapseText={collapseText}
          menuButtonProps={{
            button: <Button icon={EllipsisVerticalIcon} mode="bleed" padding={2} fontSize={1} />,
          }}
        >
          {[...Array(5).keys()].map((num) => (
            <CollapseMenuButton
              key={num}
              fontSize={1}
              padding={2}
              text={`Button ${num + 1}`}
              dividerBefore={Boolean(num % 2)}
              icon={IceCreamIcon}
              mode="bleed"
              collapsedProps={{tooltipText: 'Collapsed'}}
              expandedProps={{tooltipText: 'Expanded'}}
            />
          ))}
        </CollapseMenu>
      </Card>
    </Flex>
  )
}
