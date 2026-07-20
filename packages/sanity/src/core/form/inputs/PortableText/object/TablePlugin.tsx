// oxlint-disable-next-line no-unassigned-import -- imported for its side effects
import '@portabletext/plugin-table/ui/styles.css'

import {defineContainer, type ContainerRenderProps} from '@portabletext/editor'
import {defineBehavior, raise} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {defineTable} from '@portabletext/plugin-table'
import {
  referenceContainers,
  Table,
  type TableMenuProps,
  type TableTokens,
} from '@portabletext/plugin-table/ui'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {TrashIcon} from '@sanity/icons/Trash'
import {Flex, Menu, MenuDivider, Switch, Text, usePortal} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {useId, useMemo} from 'react'
import {createGlobalStyle, useTheme} from 'styled-components'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useTranslation} from '../../../../i18n'
import {useColorSchemeValue} from '../../../../studio/colorScheme'

const table = defineTable({
  containers: {
    ...referenceContainers,
    table: defineContainer({
      type: 'table',
      arrayField: 'rows',
      render: (props) => <StudioTable {...props} />,
    }),
  },
})

// Tables inserted from the insert menu have no rows yet. The guard also
// makes sure the raise below doesn't loop.
const scaffoldBehaviors = [
  defineBehavior({
    on: 'insert.block',
    guard: ({event}) => {
      if (event.block._type !== 'table') {
        return false
      }
      const rows = 'rows' in event.block ? event.block.rows : undefined
      return !(Array.isArray(rows) && rows.length > 0)
    },
    actions: [
      ({event}) => [
        raise({
          ...event,
          block: {...event.block, ...table.createBlock({headerRows: 1})},
        }),
      ],
    ],
  }),
]

export function PortableTextTablePlugin(): React.JSX.Element {
  return (
    <>
      <HeaderCellWeight />
      <table.Plugin />
      <BehaviorPlugin behaviors={scaffoldBehaviors} />
    </>
  )
}

// The trash button and table menu are portaled into the
// `document-panel-portal`, the same place the input's own popovers render.
function StudioTable(props: ContainerRenderProps): React.JSX.Element {
  const portal = usePortal()
  const {t} = useTranslation()
  const tokens = useTableTokens()
  return (
    <Table
      {...props}
      icons={tableIcons}
      portalElement={portal.element}
      tokens={tokens}
      labels={{
        'add-column': t('inputs.portable-text.table.add-column'),
        'add-row': t('inputs.portable-text.table.add-row'),
        'column-handle': t('inputs.portable-text.table.column-handle'),
        'delete-column': t('inputs.portable-text.table.delete-column'),
        'delete-row': t('inputs.portable-text.table.delete-row'),
        'insert-here': t('inputs.portable-text.table.insert-here'),
        'row-handle': t('inputs.portable-text.table.row-handle'),
      }}
      // Wrapped in JSX because the plugin calls `renderMenu` as a plain
      // function; a bare `StudioTableMenu` would run its hooks inside the
      // plugin's render.
      renderMenu={(menuProps) => <StudioTableMenu {...menuProps} />}
    />
  )
}

// The values ride the plugin's `tokens` prop, which applies them to the
// plugin's own elements including the portal layers, so each table
// instance carries its own set.
function useTableTokens(): TableTokens {
  const theme = useTheme()
  const scheme = useColorSchemeValue()

  return useMemo(() => {
    const {color, font, radius, space} = getTheme_v2(theme)
    return {
      '--pt-plugin-table-accent': color.focusRing,
      '--pt-plugin-table-bg': color.bg,
      '--pt-plugin-table-fg': color.fg,
      '--pt-plugin-table-border': color.border,
      '--pt-plugin-table-header-bg': color.muted.bg,
      '--pt-plugin-table-header-weight': String(font.text.weights.semibold),
      '--pt-plugin-table-selected-bg': `color-mix(in srgb, ${color.focusRing} ${
        scheme === 'dark' ? 16 : 8
      }%, transparent)`,
      '--pt-plugin-table-lane-bg': color.muted.bg,
      '--pt-plugin-table-lane-bg-hover': color.selectable.default.hovered.bg,
      '--pt-plugin-table-lane-icon': color.icon,
      '--pt-plugin-table-lane-icon-hover': color.fg,
      '--pt-plugin-table-handle-rest': color.border,
      '--pt-plugin-table-handle-bg': color.bg,
      '--pt-plugin-table-handle-dots': color.icon,
      '--pt-plugin-table-boundary-dot': color.border,
      '--pt-plugin-table-trash-bg': color.fg,
      '--pt-plugin-table-trash-fg': color.bg,
      '--pt-plugin-table-danger': color.button.default.critical.enabled.bg,
      '--pt-plugin-table-menu-bg': color.bg,
      '--pt-plugin-table-menu-border': color.border,
      '--pt-plugin-table-menu-hover': color.selectable.default.hovered.bg,
      '--pt-plugin-table-toggle-track': color.border,
      '--pt-plugin-table-toggle-track-on': color.focusRing,
      '--pt-plugin-table-toggle-knob': color.bg,
      '--pt-plugin-table-scrollbar': color.border,
      '--pt-plugin-table-scrollbar-hover': color.icon,
      '--pt-plugin-table-radius': `${radius[2]}px`,
      '--pt-plugin-table-cell-padding': `${space[2]}px ${space[3]}px`,
      '--pt-plugin-table-font-family': font.text.family,
    }
  }, [theme, scheme])
}

// The plugin sets `font-weight` on the `<td>`, but Sanity UI's `Text` sets
// its own weight and breaks the inheritance, so header text needs this rule.
const HeaderCellWeight = createGlobalStyle`
  .pt-plugin-table td[data-pt-plugin-table-header] [data-ui='Text'] {
    font-weight: var(--pt-plugin-table-header-weight, 600);
  }
`

const tableIcons = {trash: <TrashIcon />}

function StudioTableMenu(props: TableMenuProps): React.JSX.Element {
  const {t} = useTranslation()
  // A portable text field can hold any number of tables, so the menu id
  // (which wires the button's aria attributes) must be per instance.
  const menuId = useId()
  return (
    <MenuButton
      id={menuId}
      button={
        <ContextMenuButton
          tooltipProps={{content: t('inputs.portable-text.table.menu-aria-label')}}
        />
      }
      menu={
        <Menu>
          <label style={{cursor: 'pointer'}}>
            <Flex align="center" gap={3} padding={3}>
              <Switch checked={props.hasHeader} onChange={props.onToggleHeader} />
              <Text size={1} weight="medium">
                {t('inputs.portable-text.table.header-row')}
              </Text>
            </Flex>
          </label>
          <MenuDivider />
          <MenuItem
            icon={ThLargeIcon}
            onClick={props.onSelectTable}
            text={t('inputs.portable-text.table.select-table')}
          />
          <MenuDivider />
          <MenuItem
            icon={TrashIcon}
            onClick={props.onDeleteTable}
            text={t('inputs.portable-text.table.delete-table')}
            tone="critical"
          />
        </Menu>
      }
      onClose={() => props.onOpenChange(false)}
      onOpen={() => props.onOpenChange(true)}
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}
