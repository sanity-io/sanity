import {Box, Text} from '@sanity/ui'

import {MenuGroup, type MenuGroupProps} from '../../../../ui-components/menuGroup/MenuGroup'
import type {DocumentFieldActionGroup} from '../../../config/document/fieldActions/types'
import {useI18nText} from '../../../i18n/hooks/useI18nText'
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
            // oxlint-disable-next-line no-array-index-key
            key={idx}
            action={item}
            isFirst={idx === 0}
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
          // oxlint-disable-next-line no-array-index-key
          key={idx}
          action={item}
          isFirst={idx === 0}
          prevIsGroup={group.children[idx - 1]?.type === 'group'}
        />
      ))}
    </MenuGroup>
  )
}
