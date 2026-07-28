import {Box, MenuDivider, Text} from '@sanity/ui'

import {MenuGroup, type MenuGroupProps} from '../../../../ui-components/menuGroup/MenuGroup'
import {
  type DocumentFieldActionGroup,
  type DocumentFieldActionNode,
} from '../../../config/document/fieldActions/types'
import {useI18nText} from '../../../i18n/hooks/useI18nText'
import {FieldActionMenuItem} from './FieldActionMenuItem'

// `FieldActionMenuNode` and `FieldActionMenuGroup` are mutually recursive (groups render their
// children as nodes), so they live in the same module to avoid circular imports.

interface FieldActionMenuNodeProps {
  action: DocumentFieldActionNode
  isFirst: boolean
  prevIsGroup: boolean
}

export function FieldActionMenuNode(props: FieldActionMenuNodeProps) {
  const {action, isFirst, prevIsGroup} = props

  if (action.type === 'divider') {
    return <MenuDivider />
  }

  if (action.type === 'group') {
    return (
      <>
        {!isFirst && <MenuDivider />}
        <FieldActionMenuGroup group={action} />
      </>
    )
  }

  return (
    <>
      {prevIsGroup && <MenuDivider />}
      <FieldActionMenuItem action={action} />
    </>
  )
}

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
