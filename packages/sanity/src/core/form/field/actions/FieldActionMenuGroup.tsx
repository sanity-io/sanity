import {Box, Label, MenuGroup, MenuGroupProps} from '@sanity/ui'
import React from 'react'
import {DocumentFieldActionGroup} from '../../../config'
import {useI18nTitle, useTranslation} from '../../../i18n'
import {FieldActionMenuNode} from './FieldActionMenuNode'

const POPOVER_PROPS: MenuGroupProps['popover'] = {
  placement: 'right',
  fallbackPlacements: ['top', 'bottom'],
}

export function FieldActionMenuGroup(props: {group: DocumentFieldActionGroup}) {
  const {group} = props
  const title = useI18nTitle(group)

  if (group.expanded) {
    return (
      <>
        <Box padding={2} paddingBottom={1}>
          <Label muted size={0}>
            {title}
          </Label>
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
      text={title}
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
