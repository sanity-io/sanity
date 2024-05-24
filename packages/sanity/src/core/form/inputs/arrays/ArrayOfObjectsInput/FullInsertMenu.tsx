/* eslint-disable no-nested-ternary, react/jsx-no-bind */
import {SearchIcon, ThLargeIcon, UlistIcon} from '@sanity/icons'
import {type ArrayOptions, type ArraySchemaType} from '@sanity/types'
import {
  Box,
  Flex,
  Grid,
  Menu,
  Popover,
  Stack,
  Text,
  TextInput,
  useClickOutside,
  useGlobalKeyDown,
} from '@sanity/ui'
import {type ChangeEvent, type Dispatch, useCallback, useMemo, useReducer, useState} from 'react'

import {Button, MenuItem} from '../../../../../ui-components'
import {type StudioLocaleResourceKeys, useTranslation} from '../../../../i18n'
import {FieldGroupTabs} from '../../ObjectInput/fieldGroups'
import {getSchemaTypeIcon} from './getSchemaTypeIcon'

type Group = NonNullable<
  Extract<ArrayOptions['insertMenu'], {layout: 'full'}>['groups']
>[number] & {
  selected?: boolean
}

const ALL_ITEMS_GROUP_NAME = 'all-items'

type FullInsertMenuState = {
  open: boolean
  query: string
  groups: Array<Group>
  view: 'list' | 'grid'
}

type FullInsertMenuEvent =
  | {type: 'toggle'}
  | {type: 'close'}
  | {type: 'toggle view'}
  | {type: 'change query'; query: string}
  | {type: 'select group'; name: string | undefined}

function fullInsertMenuReducer(
  state: FullInsertMenuState,
  event: FullInsertMenuEvent,
): FullInsertMenuState {
  return {
    open: event.type === 'toggle' ? !state.open : event.type === 'close' ? false : state.open,
    query: event.type === 'change query' ? event.query : state.query,
    groups:
      event.type === 'select group'
        ? state.groups.map((group) => ({...group, selected: event.name === group.name}))
        : state.groups,
    view: event.type === 'toggle view' ? (state.view === 'list' ? 'grid' : 'list') : state.view,
  }
}

export function FullInsertMenuButton<TSchemaType extends ArraySchemaType>(props: {
  insertButtonProps: React.ComponentProps<typeof Button>
  groups: Extract<ArrayOptions['insertMenu'], {layout: 'full'}>['groups']
  schemaTypes: TSchemaType['of']
  onSelect: (schemaType: TSchemaType['of'][number]) => void
}) {
  const {t} = useTranslation()
  const [state, send] = useReducer(fullInsertMenuReducer, {
    open: false,
    query: '',
    groups: props.groups
      ? [
          {
            name: ALL_ITEMS_GROUP_NAME,
            title: t('inputs.array.insert-menu.filter.all-items'),
            selected: true,
          },
          ...props.groups,
        ]
      : [],
    view: 'list',
  })
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLDivElement | null>(null)

  useClickOutside(
    useCallback(() => {
      send({type: 'close'})
    }, []),
    [button, popover],
  )

  useGlobalKeyDown(
    useCallback(
      (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          send({type: 'close'})
          button?.focus()
        }
      },
      [button],
    ),
  )

  const {onSelect} = props
  const handleOnSelect = useCallback(
    (schemaType: TSchemaType['of'][number]) => {
      onSelect(schemaType)
      send({type: 'close'})
    },
    [onSelect],
  )

  return (
    <Popover
      constrainSize
      content={
        <FullInsertMenu
          onSelect={handleOnSelect}
          schemaTypes={props.schemaTypes}
          send={send}
          state={state}
        />
      }
      fallbackPlacements={['top', 'bottom']}
      matchReferenceWidth
      open={state.open}
      overflow="hidden"
      placement="bottom"
      portal
      ref={setPopover}
    >
      <Button
        {...props.insertButtonProps}
        data-testid="add-multiple-object-button"
        ref={setButton}
        selected={state.open}
        onClick={() => {
          send({type: 'toggle'})
        }}
      />
    </Popover>
  )
}

function FullInsertMenu<TSchemaType extends ArraySchemaType>(props: {
  onSelect: (schemaType: TSchemaType['of'][number]) => void
  schemaTypes: TSchemaType['of']
  send: Dispatch<FullInsertMenuEvent>
  state: FullInsertMenuState
}) {
  const {t} = useTranslation()

  const filteredSchemaTypes = useMemo(
    () => filterSchemaTypes(props.schemaTypes, props.state.query, props.state.groups),
    [props.schemaTypes, props.state.groups, props.state.query],
  )

  const ViewContainer = props.state.view === 'grid' ? Grid : Stack
  const viewToggleIcon: Record<FullInsertMenuState['view'], React.ElementType> = {
    grid: UlistIcon,
    list: ThLargeIcon,
  }
  const viewToggleTooltip: Record<FullInsertMenuState['view'], StudioLocaleResourceKeys> = {
    grid: 'inputs.array.insert-menu.toggle-list-view.tooltip',
    list: 'inputs.array.insert-menu.toggle-grid-view.tooltip',
  }

  return (
    <Flex direction="column" height="fill">
      <Flex flex="none" paddingX={1} paddingTop={1} gap={1}>
        <Box flex={1}>
          <TextInput
            autoFocus
            fontSize={1}
            icon={SearchIcon}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              props.send({type: 'change query', query: event.target.value})
            }}
            placeholder={t('inputs.array.insert-menu.search.placeholder')}
            value={props.state.query}
          />
        </Box>
        <Box flex="none">
          <Button
            mode="bleed"
            icon={viewToggleIcon[props.state.view]}
            onClick={() => {
              props.send({type: 'toggle view'})
            }}
            tooltipProps={{content: t(viewToggleTooltip[props.state.view])}}
          />
        </Box>
      </Flex>
      <Box padding={1}>
        {props.state.groups && props.state.groups.length > 0 ? (
          <Box padding={1}>
            <FieldGroupTabs
              groups={props.state.groups}
              onClick={(name) => {
                props.send({type: 'select group', name})
              }}
            />
          </Box>
        ) : null}
        <Menu>
          {filteredSchemaTypes.length === 0 ? (
            <Box padding={3}>
              <Text align="center" muted size={1}>
                {t('inputs.array.insert-menu.search.no-results')}
              </Text>
            </Box>
          ) : (
            <ViewContainer {...(props.state.view === 'grid' ? {columns: 3} : {})}>
              {filteredSchemaTypes.map((schemaType) => (
                <MenuItem
                  key={schemaType.name}
                  text={schemaType.title ?? schemaType.name}
                  onClick={() => {
                    props.onSelect(schemaType)
                  }}
                  icon={getSchemaTypeIcon(schemaType)}
                />
              ))}
            </ViewContainer>
          )}
        </Menu>
      </Box>
    </Flex>
  )
}

function filterSchemaTypes<TSchemaType extends ArraySchemaType>(
  schemaTypes: TSchemaType['of'],
  query: string,
  groups: Array<Group>,
) {
  return schemaTypes.filter(
    (schemaType) => passesGroupFilter(schemaType, groups) && passesQueryFilter(schemaType, query),
  )
}

function passesQueryFilter<TSchemaType extends ArraySchemaType>(
  schemaType: TSchemaType['of'][number],
  query: string,
) {
  const sanitizedQuery = query.trim().toLowerCase()

  return schemaType.title
    ? schemaType.title?.toLowerCase().includes(sanitizedQuery)
    : schemaType.name.includes(sanitizedQuery)
}

function passesGroupFilter<TSchemaType extends ArraySchemaType>(
  schemaType: TSchemaType['of'][number],
  groups: Array<Group>,
) {
  const selectedGroup = groups.find((group) => group.selected)

  return selectedGroup
    ? selectedGroup.name === ALL_ITEMS_GROUP_NAME
      ? true
      : selectedGroup.of?.includes(schemaType.name)
    : true
}
