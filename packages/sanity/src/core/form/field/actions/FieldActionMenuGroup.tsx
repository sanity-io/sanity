import {Box, MenuGroup, MenuGroupProps, Text} from '@sanity/ui'
import React from 'react'
import {DocumentFieldActionGroup} from '../../../config'
import {FieldActionMenuNode} from './FieldActionMenuNode'

const POPOVER_PROPS: MenuGroupProps['popover'] = {
  placement: 'right',
  fallbackPlacements: ['top', 'bottom'],
}

export function FieldActionMenuGroup(props: {group: DocumentFieldActionGroup}) {
  const {group} = props

  if (group.expanded) {
    return (
      <>
        <Box padding={2} paddingTop={3}>
          <Text muted size={1} weight="medium">
            {group.title}
          </Text>
        </Box>

        {group.children.map((item, idx) => (
          <FieldActionMenuNode
            action={item}
            isFirst={idx === 0}
            // eslint-disable-next-line react/no-array-index-key
            key={idx}
            prevIsGroup={group.children[idx - 1]?.type === 'group'}
          />
        ))}
      </>
    )
  }

  return (
    <MenuGroup
      fontSize={1}
      icon={group.icon}
      padding={3}
      popover={POPOVER_PROPS}
      space={3}
      text={group.title}
      tone={group.tone}
    >
      {group.children.map((item, idx) => (
        <FieldActionMenuNode
          action={item}
          isFirst={idx === 0}
          // eslint-disable-next-line react/no-array-index-key
          key={idx}
          prevIsGroup={group.children[idx - 1]?.type === 'group'}
        />
      ))}
    </MenuGroup>
  )
}
