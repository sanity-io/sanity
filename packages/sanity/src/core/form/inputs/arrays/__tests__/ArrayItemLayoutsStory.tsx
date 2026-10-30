import {ImageIcon} from '@sanity/icons/Image'
import {TrashIcon} from '@sanity/icons/Trash'
import {type FormNodeValidation} from '@sanity/types'
import {Card, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ReactNode} from 'react'
import {Text, Box, VStack, Icon} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {ContextMenuButton} from '../../../../components/contextMenuButton/ContextMenuButton'
import {FieldPresenceInner} from '../../../../presence/FieldPresence'
import {FormFieldValidationStatus} from '../../../components/formField/FormFieldValidationStatus'
import {DragHandle} from '../common/DragHandle'
import {Item, List} from '../common/list'
import {CellLayout} from '../layouts/CellLayout'
import {RowLayout} from '../layouts/RowLayout'

const MENU_POPOVER_PROPS = {portal: true, tone: 'default'} as const
const GRID_ITEMS = ['cell-a', 'cell-b', 'cell-c']
const ROW_ITEMS = ['row-a', 'row-b', 'row-c']
const HANDLE_ITEMS = ['handle-a', 'handle-b', 'handle-c']

const REQUIRED_ERROR: FormNodeValidation[] = [
  {level: 'error', message: 'Required', path: ['items', {_key: 'cell-c'}]},
]

const PRESENCE = [
  {
    user: {id: 'user-ada', displayName: 'Ada Lovelace'},
    path: ['items', {_key: 'cell-b'}],
    sessionId: 'session-ada',
    lastActiveAt: '2024-01-01T00:00:00.000Z',
  },
]

function ItemMenu({id}: {id: string}) {
  return (
    <MenuButton
      button={<ContextMenuButton />}
      id={`${id}-menuButton`}
      menu={
        <Menu>
          <MenuItem icon={TrashIcon} text="Remove" tone="critical" />
        </Menu>
      }
      popover={MENU_POPOVER_PROPS}
    />
  )
}

const validation = (
  <Box paddingX={1} paddingY={3}>
    <FormFieldValidationStatus validation={REQUIRED_ERROR} />
  </Box>
)

const presence = <FieldPresenceInner presence={PRESENCE} maxAvatars={1} />

function CellPreview({title, media}: {title: string; media?: ReactNode}) {
  return (
    <Card flex={1} padding={3} tone="inherit">
      <VStack gap={3}>
        {media}
        <Text size={1} truncate={1} weight="medium" as="div" trim={true}>
          {title}
        </Text>
      </VStack>
    </Card>
  )
}

const MEDIA = (
  <Card
    padding={4}
    radius={2}
    tone="transparent"
    style={{display: 'flex', justifyContent: 'center'}}
  >
    <Icon muted size={4} icon={ImageIcon} style={{margin: '-0.5625rem'}} />
  </Card>
)

/**
 * Chromatic sentinel for the array item chrome that the ui5 Flex migration
 * touches. `CellLayout` is a `Card` forwarded as `Flex` in column direction:
 * the preview grows and the footer (validation, menu) is pinned to the
 * bottom, so the cells get a minimum height and one cell a taller preview.
 * If the Card's display wins over the Flex's, the footers stop lining up.
 * `RowLayout` puts the drag handle, the input and the presence, validation
 * and menu cluster on one line. Items mount inside the real sortable `List`
 * so the drag handles resolve a dnd-kit context; menus stay closed.
 */
export function ArrayItemLayoutsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 640}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              grid cells (default, presence, error + selected)
            </Text>
            <Card border padding={1} radius={1}>
              <List
                gap={3}
                gridTemplateColumns="repeat(3, minmax(0, 1fr))"
                items={GRID_ITEMS}
                margin={1}
                padding={1}
                sortable
              >
                <Item id="cell-a" sortable>
                  <CellLayout dragHandle menu={<ItemMenu id="cell-a" />} style={{minHeight: 200}}>
                    <CellPreview media={MEDIA} title="Hero image" />
                  </CellLayout>
                </Item>
                <Item id="cell-b" sortable>
                  <CellLayout
                    dragHandle
                    menu={<ItemMenu id="cell-b" />}
                    presence={presence}
                    style={{minHeight: 200}}
                  >
                    <CellPreview title="Short caption" />
                  </CellLayout>
                </Item>
                <Item id="cell-c" sortable>
                  <CellLayout
                    dragHandle
                    menu={<ItemMenu id="cell-c" />}
                    selected
                    style={{minHeight: 200}}
                    tone="critical"
                    validation={validation}
                  >
                    <CellPreview title="A much longer caption that has to truncate in the cell" />
                  </CellLayout>
                </Item>
              </List>
            </Card>
          </VStack>

          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              rows (default, presence + error + selected, read-only + footer)
            </Text>
            <Card border padding={1} radius={1}>
              <List axis="y" gap={1} items={ROW_ITEMS} sortable>
                <Item id="row-a" sortable>
                  <RowLayout dragHandle menu={<ItemMenu id="row-a" />} readOnly={false}>
                    <TextInput defaultValue="First tag" />
                  </RowLayout>
                </Item>
                <Item id="row-b" sortable>
                  <RowLayout
                    dragHandle
                    menu={<ItemMenu id="row-b" />}
                    presence={presence}
                    readOnly={false}
                    selected
                    tone="critical"
                    validation={validation}
                  >
                    <TextInput defaultValue="Second tag" />
                  </RowLayout>
                </Item>
                <Item id="row-c" sortable>
                  <RowLayout
                    dragHandle
                    footer={
                      <Box paddingX={2} paddingBottom={2}>
                        <Text muted size={1} as="div" trim={true}>
                          Footer slot
                        </Text>
                      </Box>
                    }
                    readOnly
                    tone="transparent"
                  >
                    <TextInput defaultValue="Read-only tag" readOnly />
                  </RowLayout>
                </Item>
              </List>
            </Card>
          </VStack>

          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              drag handles (list bleed, grid ghost, read-only)
            </Text>
            <Card border padding={1} radius={1}>
              <List axis="y" gap={1} items={HANDLE_ITEMS} sortable>
                <Item id="handle-a" sortable>
                  <Card border padding={1} radius={2}>
                    <DragHandle readOnly={false} />
                  </Card>
                </Item>
                <Item id="handle-b" sortable>
                  <Card border padding={1} radius={2}>
                    <DragHandle $grid mode="ghost" size="large" readOnly={false} />
                  </Card>
                </Item>
                <Item id="handle-c" sortable>
                  <Card border padding={1} radius={2}>
                    <DragHandle readOnly />
                  </Card>
                </Item>
              </List>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
