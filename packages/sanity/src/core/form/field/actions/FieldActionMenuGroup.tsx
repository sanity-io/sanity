import {Box, Text} from '@sanity/ui'
import React from 'react'
import {MenuGroup, MenuGroupProps} from '../../../../ui-components'
import {DocumentFieldActionGroup} from '../../../config'
import {useI18nText} from '../../../i18n'
import {FieldActionMenuNode} from './FieldActionMenuNode'

const POPOVER_PROPS: MenuGroupProps['popover'] = {
  placement: 'right',
  fallbackPlacements: ['top', 'bottom'],
}

export function FieldActionMenuGroup(props: {group: DocumentFieldActionGroup}) {
  const {group} = props
  const {title} = useI18nText(group)

  if (group.expanded) {
    return (
      <>
        <Box padding={2} paddingTop={3}>
          <Text muted size={1} weight="medium">
            {title}
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
    <MenuGroup icon={group.icon} popover={POPOVER_PROPS} text={title} tone={group.tone}>
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
