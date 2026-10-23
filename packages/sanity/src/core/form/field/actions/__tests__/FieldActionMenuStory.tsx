import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {TrashIcon} from '@sanity/icons/Trash'
import {Card, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type DocumentFieldActionNode} from '../../../../config/document/fieldActions/types'
import {FieldActionMenu} from '../FieldActionMenu'
import {FieldActionMenuItem} from '../FieldActionMenuItem'
import {FieldActionMenuNode} from '../FieldActionMenuNode'

const COPY_ACTION = {
  type: 'action' as const,
  icon: CopyIcon,
  title: 'Copy field',
  onAction: noop,
}

const EDIT_ACTION = {
  type: 'action' as const,
  icon: EditIcon,
  title: 'Edit field',
  onAction: noop,
  selected: true,
}

const DELETE_ACTION = {
  type: 'action' as const,
  icon: TrashIcon,
  title: 'Clear field',
  onAction: noop,
  tone: 'critical' as const,
  disabled: {reason: 'The field is empty'},
}

const EXPANDED_GROUP: DocumentFieldActionNode = {
  type: 'group',
  title: 'Advanced',
  expanded: true,
  children: [EDIT_ACTION, DELETE_ACTION],
}

const MENU_NODES: DocumentFieldActionNode[] = [
  COPY_ACTION,
  {type: 'divider'},
  {
    type: 'group',
    title: 'Advanced',
    icon: EllipsisHorizontalIcon,
    children: [EDIT_ACTION, DELETE_ACTION],
  },
]

/**
 * Chromatic sentinel for field-action menu chrome after the ui5 Box
 * migration. The expanded group paints a muted Box title above its items;
 * selected, disabled, and critical tones sit on MenuItem. FieldActionMenu
 * is the closed overflow trigger used on form fields. Fixture titles only.
 */
export function FieldActionMenuStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              overflow trigger
            </Text>
            <FieldActionMenu nodes={MENU_NODES} onMenuOpenChange={noop} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              expanded group
            </Text>
            <Card padding={1} radius={2} shadow={2} style={{maxWidth: 280}}>
              <Menu>
                <FieldActionMenuNode action={COPY_ACTION} isFirst prevIsGroup={false} />
                <FieldActionMenuNode
                  action={{type: 'divider'}}
                  isFirst={false}
                  prevIsGroup={false}
                />
                <FieldActionMenuNode action={EXPANDED_GROUP} isFirst={false} prevIsGroup={false} />
                <FieldActionMenuItem action={DELETE_ACTION} />
              </Menu>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}

/**
 * FieldActionMenu with the overflow menu open. One instance so the trigger
 * id stays unique.
 */
export function FieldActionMenuOpenStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{minHeight: 280}}>
        <FieldActionMenu nodes={MENU_NODES} onMenuOpenChange={noop} />
      </Card>
    </TestWrapper>
  )
}
