/* oxlint-disable no-restricted-imports -- this vendored insert menu mirrors the app-frontend build and uses @sanity/ui primitives directly; the studio ui-components wrappers are not API-compatible (e.g. MenuItem with children) */
import {SearchIcon} from '@sanity/icons/Search'
import {ThLargeIcon} from '@sanity/icons/ThLarge'
import {UlistIcon} from '@sanity/icons/Ulist'
import {type InsertMenuOptions, type SchemaType} from '@sanity/types'
import {
  Box,
  Button,
  Flex,
  Grid,
  Menu,
  MenuItem,
  Stack,
  Tab,
  TabList,
  Text,
  TextInput,
  Tooltip,
  type MenuItemProps,
} from '@sanity/ui'
import startCase from 'lodash-es/startCase.js'
import {useReducer, useState, type ChangeEvent, type CSSProperties} from 'react'
import {isValidElementType} from 'react-is'

import {getSchemaTypeIcon} from './getSchemaTypeIcon'

type InsertMenuGroup = NonNullable<InsertMenuOptions['groups']>[number] & {selected: boolean}
type InsertMenuViews = NonNullable<InsertMenuOptions['views']>
type InsertMenuView = InsertMenuViews[number]

type InsertMenuEvent =
  | {type: 'toggle view'; name: InsertMenuView['name']}
  | {type: 'change query'; query: string}
  | {type: 'select group'; name: string | undefined}

type InsertMenuState = {
  query: string
  groups: Array<InsertMenuGroup>
  views: Array<InsertMenuViews[number] & {selected: boolean}>
}

function fullInsertMenuReducer(state: InsertMenuState, event: InsertMenuEvent): InsertMenuState {
  return {
    query: event.type === 'change query' ? event.query : state.query,
    groups:
      event.type === 'select group'
        ? state.groups.map((group) => ({...group, selected: event.name === group.name}))
        : state.groups,
    views:
      event.type === 'toggle view'
        ? state.views.map((view) => ({...view, selected: event.name === view.name}))
        : state.views,
  }
}

const ALL_ITEMS_GROUP_NAME = 'all-items'

const gridStyle: CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))',
  alignItems: 'start',
}

/** @alpha */
export type InsertMenuProps = InsertMenuOptions & {
  schemaTypes: Array<SchemaType>
  onSelect: (schemaType: SchemaType) => void
  labels: {
    'insert-menu.filter.all-items': string
    'insert-menu.search.no-results': string
    'insert-menu.search.placeholder': string
    'insert-menu.toggle-grid-view.tooltip': string
    'insert-menu.toggle-list-view.tooltip': string
  }
}

/** @alpha */
export function InsertMenu(props: InsertMenuProps): React.JSX.Element {
  const showIcons = props.showIcons === undefined ? true : props.showIcons
  const showFilter =
    props.filter === undefined || props.filter === 'auto'
      ? props.schemaTypes.length > 5
      : props.filter
  const [state, send] = useReducer(fullInsertMenuReducer, {
    query: '',
    groups: props.groups
      ? [
          {
            name: ALL_ITEMS_GROUP_NAME,
            title: props.labels['insert-menu.filter.all-items'],
            selected: true,
          },
          ...props.groups.map((group) => ({...group, selected: false})),
        ]
      : [],
    views: (props.views ?? [{name: 'list'}]).map((view, index) => ({
      ...view,
      selected: index === 0,
    })),
  })
  const filteredSchemaTypes = filterSchemaTypes(props.schemaTypes, state.query, state.groups)
  const selectedView = state.views.find((view) => view.selected)
  const showingFilterOrViews = showFilter || state.views.length > 1
  const showingTabs = state.groups && state.groups.length > 0
  const showingAnyOptions = showingFilterOrViews || showingTabs

  return (
    <Menu padding={0}>
      <Flex direction="column" height="fill">
        <Box
          {...(showingAnyOptions
            ? {
                style: {borderBottom: '1px solid var(--card-border-color)'},
                paddingBottom: 1,
              }
            : {})}
        >
          {/* filter and views button */}
          {showingFilterOrViews ? (
            <Flex flex="none" align="center" paddingTop={1} paddingX={1} gap={1}>
              {showFilter ? (
                <Box flex={1}>
                  <TextInput
                    autoFocus
                    border={false}
                    fontSize={1}
                    icon={SearchIcon}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => {
                      send({type: 'change query', query: event.target.value})
                    }}
                    placeholder={props.labels['insert-menu.search.placeholder']}
                    value={state.query}
                  />
                </Box>
              ) : null}
              {state.views.length > 1 ? (
                <Box flex="none">
                  <ViewToggle
                    views={state.views}
                    onToggle={(name) => {
                      send({type: 'toggle view', name})
                    }}
                    labels={props.labels}
                  />
                </Box>
              ) : null}
            </Flex>
          ) : null}

          {/* tabs */}
          {showingTabs ? (
            <Box paddingTop={1} paddingX={1}>
              <TabList space={1}>
                {state.groups.map((group) => (
                  <Tab
                    id={`${group.name}-tab`}
                    aria-controls={`${group.name}-panel`}
                    key={group.name}
                    label={group.title ?? startCase(group.name)}
                    selected={group.selected}
                    onClick={() => {
                      send({type: 'select group', name: group.name})
                    }}
                  />
                ))}
              </TabList>
            </Box>
          ) : null}
        </Box>

        {/* results */}
        <Box padding={1}>
          {filteredSchemaTypes.length === 0 ? (
            <Box padding={2}>
              <Text muted size={1}>
                {props.labels['insert-menu.search.no-results']}
              </Text>
            </Box>
          ) : !selectedView ? null : selectedView.name === 'grid' ? (
            <Grid autoRows="auto" flex={1} gap={1} style={gridStyle}>
              {filteredSchemaTypes.map((schemaType) => (
                <GridMenuItem
                  key={schemaType.name}
                  icon={showIcons ? getSchemaTypeIcon(schemaType) : undefined}
                  onClick={() => {
                    props.onSelect(schemaType)
                  }}
                  previewImageUrl={selectedView.previewImageUrl?.(schemaType.name)}
                  schemaType={schemaType}
                />
              ))}
            </Grid>
          ) : (
            <Stack flex={1} space={1}>
              {filteredSchemaTypes.map((schemaType) => (
                <MenuItem
                  key={schemaType.name}
                  icon={showIcons ? getSchemaTypeIcon(schemaType) : undefined}
                  onClick={() => {
                    props.onSelect(schemaType)
                  }}
                  text={schemaType.title ?? startCase(schemaType.name)}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Flex>
    </Menu>
  )
}

const viewToggleIcon: Record<InsertMenuView['name'], React.ElementType> = {
  grid: ThLargeIcon,
  list: UlistIcon,
}

const viewToggleTooltip: Record<InsertMenuView['name'], keyof ViewToggleProps['labels']> = {
  grid: 'insert-menu.toggle-grid-view.tooltip',
  list: 'insert-menu.toggle-list-view.tooltip',
}

type ViewToggleProps = {
  views: InsertMenuState['views']
  onToggle: (viewName: InsertMenuView['name']) => void
  labels: Pick<
    InsertMenuProps['labels'],
    'insert-menu.toggle-grid-view.tooltip' | 'insert-menu.toggle-list-view.tooltip'
  >
}

function ViewToggle(props: ViewToggleProps) {
  const viewIndex = props.views.findIndex((view) => view.selected)
  const nextView = props.views[viewIndex + 1] ?? props.views[0]!

  return (
    <Tooltip
      content={<Text size={1}>{props.labels[viewToggleTooltip[nextView.name]]}</Text>}
      placement="top"
      portal
    >
      <Button
        mode="bleed"
        icon={viewToggleIcon[nextView.name]}
        onClick={() => {
          props.onToggle(nextView.name)
        }}
      />
    </Tooltip>
  )
}

type GridMenuItemProps = {
  onClick: () => void
  schemaType: SchemaType
  icon: MenuItemProps['icon']
  previewImageUrl: ReturnType<
    NonNullable<
      Extract<NonNullable<InsertMenuOptions['views']>[number], {name: 'grid'}>['previewImageUrl']
    >
  >
}

function GridMenuItem(props: GridMenuItemProps) {
  const [failedToLoad, setFailedToLoad] = useState(false)
  const Icon = props.icon
  const hasPreviewImage = Boolean(props.previewImageUrl) && !failedToLoad

  return (
    <MenuItem padding={0} radius={2} onClick={props.onClick} style={{overflow: 'hidden'}}>
      <Flex direction="column" gap={1} padding={1}>
        <Box
          flex="none"
          style={{
            backgroundColor: 'var(--card-muted-bg-color)',
            paddingBottom: '66.6%',
            position: 'relative',
          }}
        >
          {isValidElementType(Icon) && !hasPreviewImage ? (
            <Flex
              align="center"
              justify="center"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
            >
              <Text size={1}>
                <Icon />
              </Text>
            </Flex>
          ) : null}
          {hasPreviewImage ? (
            <img
              src={props.previewImageUrl}
              style={{
                objectFit: 'contain',
                width: '100%',
                height: '100%',
                position: 'absolute',
                inset: 0,
              }}
              onError={() => {
                setFailedToLoad(true)
              }}
            />
          ) : null}

          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              boxShadow: 'inset 0 0 0 0.5px var(--card-fg-color)',
              opacity: 0.1,
            }}
          />
        </Box>
        <Box flex="none" paddingX={2} paddingY={1}>
          <Text size={1} weight="medium">
            {props.schemaType.title ?? props.schemaType.name}
          </Text>
        </Box>
      </Flex>
    </MenuItem>
  )
}

function filterSchemaTypes(
  schemaTypes: Array<SchemaType>,
  query: string,
  groups: Array<InsertMenuGroup>,
) {
  return schemaTypes.filter(
    (schemaType) => passesGroupFilter(schemaType, groups) && passesQueryFilter(schemaType, query),
  )
}

function passesQueryFilter(schemaType: SchemaType, query: string) {
  const sanitizedQuery = query.trim().toLowerCase()

  return schemaType.title
    ? schemaType.title?.toLowerCase().includes(sanitizedQuery)
    : schemaType.name.includes(sanitizedQuery)
}

function passesGroupFilter(schemaType: SchemaType, groups: Array<InsertMenuGroup>) {
  const selectedGroup = groups.find((group) => group.selected)

  return selectedGroup
    ? selectedGroup.name === ALL_ITEMS_GROUP_NAME
      ? true
      : selectedGroup.of?.includes(schemaType.name)
    : true
}
