import {DocumentIcon} from '@sanity/icons/Document'
import {EditIcon} from '@sanity/icons/Edit'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {TrashIcon} from '@sanity/icons/Trash'
import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {PaneMenuButtonItem} from '../PaneMenuButtonItem'
import {type _PaneMenuNode} from '../types'

const NOOP = () => undefined

const NODES: _PaneMenuNode[] = [
  {
    type: 'group',
    key: 'display',
    title: 'Display options',
    expanded: true,
    renderAsButton: false,
    children: [
      {
        type: 'item',
        key: 'grid',
        title: 'Grid view',
        icon: DocumentIcon,
        renderAsButton: false,
        selected: true,
        onAction: NOOP,
      },
      {
        type: 'item',
        key: 'list',
        title: 'List view',
        icon: EyeClosedIcon,
        renderAsButton: false,
        onAction: NOOP,
      },
    ],
  },
  {
    type: 'group',
    key: 'actions',
    title: 'Document',
    expanded: true,
    renderAsButton: false,
    children: [
      {
        type: 'item',
        key: 'edit',
        title: 'Edit',
        icon: EditIcon,
        hotkey: 'Ctrl+E',
        renderAsButton: false,
        onAction: NOOP,
      },
      {
        type: 'item',
        key: 'delete',
        title: 'Delete',
        icon: TrashIcon,
        tone: 'critical',
        disabled: {reason: 'You do not have permission to delete'},
        renderAsButton: false,
        onAction: NOOP,
      },
    ],
  },
  {
    type: 'group',
    key: 'export',
    title: 'Export',
    expanded: false,
    icon: DocumentIcon,
    renderAsButton: false,
    children: [
      {
        type: 'item',
        key: 'json',
        title: 'Export as JSON',
        icon: DocumentIcon,
        renderAsButton: false,
        onAction: NOOP,
      },
    ],
  },
]

/**
 * Chromatic sentinel for pane action-menu rows after the ui5 Box migration
 * on expanded group titles. Selected / critical / disabled items plus a
 * closed (unexpanded) group sit in one Menu. Titles are fixture strings;
 * the collapsed flyout is left closed (MenuGroup Open already covers it).
 */
export function PaneMenuButtonItemStory() {
  return (
    <TestWrapper i18nBundles={[structureUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            expanded groups and closed submenu
          </Text>
          <Card padding={1} radius={2} shadow={2}>
            <Menu>
              {NODES.map((node, index) => (
                <PaneMenuButtonItem
                  key={node.key}
                  isAfterGroup={index > 0 && NODES[index - 1]?.type === 'group'}
                  node={node}
                />
              ))}
            </Menu>
          </Card>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
