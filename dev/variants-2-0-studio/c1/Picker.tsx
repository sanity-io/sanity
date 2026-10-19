// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 2700f4cf07, lib/explorations/variants-2-0/perspective/Picker.tsx).
// Changes: imports point at this monorepo and ./model; LIVE: marks the few places that read live data.
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'

import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {useMemo, useState} from 'react'

import {type DimensionSpec} from './model'
import {matches, type Chosen, valueTitle} from './model'
import {MenuPopover} from './primitives'
import {DimensionIcon} from './dimensionIcons'

/** How many dimensions pick the form: one is a list, two to four are columns, five or more a rail. */
export type PanelForm = 'list' | 'columns' | 'rail'
export const panelForm = (dimensions: number): PanelForm =>
  dimensions <= 1 ? 'list' : dimensions <= 4 ? 'columns' : 'rail'

const COLUMN_WIDTH = 256
const RAIL_WIDTH = 216
export const panelWidth = (dimensions: number) => {
  const form = panelForm(dimensions)
  if (form === 'list') return 320
  // Panel padding 12 on each side, 20 (the space token) between columns.
  if (form === 'columns') return dimensions * COLUMN_WIDTH + (dimensions - 1) * 20 + 24
  return 640
}
const LIST_MAX = 336

/** "42 articles. 9 show the base document." Fixture constants. */
export const HINT = '42 articles. 9 show the base document.'

/** A definition of a dimension: the real `MenuItem` at the loose density, the real selected state. */
function Definition(props: {
  dimension: string
  title: string
  testId: string
  selected: boolean
  onClick: () => void
  trailing?: string
}) {
  return (
    <MenuItem
      data-testid={props.testId}
      icon={<DimensionIcon name={props.dimension} selected={props.selected} />}
      iconRight={props.trailing ? <span>{props.trailing}</span> : undefined}
      onClick={props.onClick}
      pressed={props.selected}
      selected={props.selected}
      text={props.title}
    />
  )
}

/**
 * The one panel of C1, for the Variants control and for the row's Add dimension, the pending chip and
 * a chip being edited. Search first, then the form the number of dimensions picks:
 * - one dimension: a flat list with a Default row, no header, no indent;
 * - two to four: one column each, under a header (icon and name), definitions indented;
 * - five or more: a rail (icon and name, the picked definition at the right) and the active list.
 * Every pick applies at once. No counts. The footer shows only when something is picked.
 * Rows are the Studio's `MenuItem` (33px); the library draws a search of 33px and padding 12, gap 8.
 */
export function PickerContent(props: {
  dimensions: readonly DimensionSpec[]
  chosen: Chosen
  /** The dimension the rail starts on. */
  start?: string
  /** `null` is the Default row: the dimension is cleared. */
  onPick: (dimension: string, key: string | null) => void
  onClear: () => void
}) {
  const {dimensions, chosen, onPick} = props
  const form = panelForm(dimensions.length)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(
    props.start ?? dimensions.find((d) => !chosen[d.name])?.name ?? dimensions[0]?.name,
  )
  const spec = dimensions.find((d) => d.name === active) ?? dimensions[0]
  const searching = !!query.trim()
  const any = Object.keys(chosen).length > 0
  const hits = useMemo(
    () =>
      searching
        ? dimensions.flatMap((d) =>
            d.values
              .filter(([, title]) => matches(title, query) || matches(d.title, query))
              .map(([key, title]) => ({d, key, title})),
          )
        : [],
    [dimensions, query, searching],
  )
  const values = (d: DimensionSpec) =>
    d.values.filter(([, title]) => !searching || matches(title, query))
  const list = (d: DimensionSpec, withDefault?: boolean) => (
    <Menu
      data-testid={`list-${d.name}`}
      padding={0}
      style={{maxHeight: LIST_MAX, overflowY: 'auto'}}
    >
      {withDefault && !searching ? (
        <MenuItem
          data-testid={`picker-default-${d.name}`}
          onClick={() => onPick(d.name, null)}
          pressed={!chosen[d.name]}
          selected={!chosen[d.name]}
          text="Default"
        />
      ) : null}
      {values(d).map(([key, title]) => (
        <Definition
          dimension={d.name}
          key={key}
          onClick={() => onPick(d.name, key)}
          selected={chosen[d.name] === key}
          testId={`picker-value-${d.name}-${key}`}
          title={title}
        />
      ))}
      {!values(d).length ? (
        <Box padding={3}>
          <Text muted size={1}>{`Nothing matches “${query}”.`}</Text>
        </Box>
      ) : null}
    </Menu>
  )
  return (
    <div
      data-form={form}
      data-testid="address-picker"
      style={{width: panelWidth(dimensions.length)}}
    >
      <Box padding={3}>
        <Stack gap={2}>
          <TextInput
            autoFocus
            data-testid="picker-search"
            fontSize={1}
            icon={SearchIcon}
            onChange={(event) => setQuery(event.currentTarget.value)}
            padding={3}
            placeholder={
              form === 'list' && spec ? `Find in ${spec.title}` : 'Find a dimension or a value'
            }
            radius={2}
            value={query}
          />
          {form === 'list' && spec ? (
            list(spec, true)
          ) : form === 'columns' ? (
            <Flex gap={4}>
              {dimensions.map((d) => (
                <Stack
                  data-testid={`column-${d.name}`}
                  flex="none"
                  gap={2}
                  key={d.name}
                  style={{width: COLUMN_WIDTH}}
                >
                  <Flex align="center" gap={2} paddingX={2} paddingTop={2}>
                    <Text size={1}>
                      <DimensionIcon name={d.name} />
                    </Text>
                    <Text size={1} weight="medium">
                      {d.title}
                    </Text>
                  </Flex>
                  <Box paddingLeft={3}>{list(d)}</Box>
                </Stack>
              ))}
            </Flex>
          ) : searching ? (
            <Menu padding={0} style={{maxHeight: LIST_MAX, overflowY: 'auto'}}>
              {hits.map(({d, key, title}) => (
                <Definition
                  dimension={d.name}
                  key={`${d.name}-${key}`}
                  onClick={() => onPick(d.name, key)}
                  selected={chosen[d.name] === key}
                  testId={`picker-value-${d.name}-${key}`}
                  title={title}
                  trailing={d.title}
                />
              ))}
              {!hits.length ? (
                <Box padding={3}>
                  <Text muted size={1}>{`Nothing matches “${query}”.`}</Text>
                </Box>
              ) : null}
            </Menu>
          ) : (
            <Flex gap={2} style={{height: LIST_MAX}}>
              <Menu data-testid="picker-rail" padding={0} style={{width: RAIL_WIDTH, flex: 'none'}}>
                {dimensions.map((d) => (
                  <MenuItem
                    data-testid={`picker-dimension-${d.name}`}
                    icon={<DimensionIcon name={d.name} selected={d.name === spec?.name} />}
                    iconRight={
                      chosen[d.name] ? <span>{valueTitle(d, chosen[d.name])}</span> : undefined
                    }
                    key={d.name}
                    onClick={() => setActive(d.name)}
                    pressed={d.name === spec?.name}
                    selected={d.name === spec?.name}
                    text={d.title}
                  />
                ))}
              </Menu>
              <Card borderLeft flex={1} paddingLeft={3}>
                {spec ? list(spec) : null}
              </Card>
            </Flex>
          )}
          {any ? (
            <Card borderTop data-testid="picker-footer" paddingTop={2}>
              <Flex align="center" gap={2}>
                <Box flex={1}>
                  <Text muted size={1}>
                    {HINT}
                  </Text>
                </Box>
                <Button
                  data-testid="picker-clear"
                  mode="bleed"
                  onClick={props.onClear}
                  text="Clear"
                  tooltipProps={null}
                />
              </Flex>
            </Card>
          ) : null}
        </Stack>
      </Box>
    </div>
  )
}

export function Picker(props: {
  anchor: HTMLElement | null
  open: boolean
  onClose: () => void
  dimensions: readonly DimensionSpec[]
  chosen: Chosen
  start?: string
  onPick: (dimension: string, key: string | null) => void
  onClear: () => void
  placement?: 'bottom-start' | 'bottom-end'
  testId?: string
}) {
  return (
    <MenuPopover
      anchor={props.anchor}
      onDismiss={props.onClose}
      open={props.open}
      placement={props.placement}
      testId={props.testId ?? 'address-picker-popover'}
      width={panelWidth(props.dimensions.length)}
    >
      <PickerContent
        chosen={props.chosen}
        dimensions={props.dimensions}
        onClear={props.onClear}
        onPick={props.onPick}
        start={props.start}
      />
    </MenuPopover>
  )
}
