import {PublishIcon} from '@sanity/icons/Publish'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Card, Text} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import noop from 'lodash-es/noop.js'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {structureUsEnglishLocaleBundle} from '../../../../i18n'
import {ActionMenuButton, ActionMenuListItem} from '../ActionMenuButton'

const PUBLISH_ACTION = {
  label: 'Publish',
  icon: PublishIcon,
  onHandle: noop,
  shortcut: 'Ctrl+Alt+P',
}

const UNPUBLISH_ACTION = {
  label: 'Unpublish',
  icon: UnpublishIcon,
  onHandle: noop,
  tone: 'caution' as const,
}

const DELETE_ACTION = {
  label: 'Delete',
  icon: TrashIcon,
  onHandle: noop,
  tone: 'critical' as const,
  disabled: true,
  title: 'You are not allowed to delete this document',
}

const ACTION_STATES = [PUBLISH_ACTION, UNPUBLISH_ACTION, DELETE_ACTION]

/**
 * Chromatic sentinel for the document-footer overflow menu after the ui5
 * MenuItem migration. Closed ContextMenuButton, expanded rows (shortcut,
 * caution, disabled), and a disabled trigger. Fixture labels only — no live
 * document actions.
 */
export function ActionMenuButtonStory() {
  return (
    <TestWrapper i18nBundles={[structureUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              overflow trigger
            </Text>
            <ActionMenuButton actionStates={ACTION_STATES} disabled={false} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              overflow trigger disabled
            </Text>
            <ActionMenuButton actionStates={ACTION_STATES} disabled />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              menu rows
            </Text>
            <Card padding={1} radius={2} shadow={2} style={{maxWidth: 280}}>
              <Menu padding={1}>
                <ActionMenuListItem
                  actionState={PUBLISH_ACTION}
                  disabled={false}
                  index={0}
                  onAction={noop}
                />
                <ActionMenuListItem
                  actionState={UNPUBLISH_ACTION}
                  disabled={false}
                  index={1}
                  onAction={noop}
                />
                <ActionMenuListItem
                  actionState={DELETE_ACTION}
                  disabled={false}
                  index={2}
                  onAction={noop}
                />
              </Menu>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
