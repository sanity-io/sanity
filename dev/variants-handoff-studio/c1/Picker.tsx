import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type FocusEvent, type KeyboardEvent, useEffect, useRef, useState} from 'react'

// Ported from the Storybook Variants 2.0 exploration (sanity-labs/sanity-studio-storybook, branch
// explorations/variants-2-0, commit 6acf5bfa24, lib/explorations/variants-2-0/perspective/Picker.tsx).
// Changes: imports point at this monorepo and ./model; LIVE: marks the few places that read live data.
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {DimensionIcon} from './dimensionIcons'
import {type DimensionSpec, matches, type Chosen, valueTitle} from './model'
import {MenuPopover} from './primitives'
import {rankSearch} from './search'

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

/**
 * The label of the inert save stub in the columns form. One constant: the final wording (Save, Apply or Create) is an open
 * decision, so changing it here changes it everywhere. The word "composite" is not used in the UI. The stub does nothing; saving a combination needs storage.
 */
export const SAVE_AS_COMPOSITE_LABEL = 'Save perspective as preset'
export const SAVE_AS_COMPOSITE_REASON =
  'Needs storage: a saved combination has nowhere to live yet.'

const ITEM = '[data-ui="MenuItem"]'

/** The row with no variant: the base document, worded as the T3 versions popover words it. */
export const DEFAULT_LABEL = 'All users (Default)'

/**
 * The panel's keyboard model. The rows are `tabindex=-1` items of real Menus, so Tab would leave
 * the panel; instead the panel is one focus group with four stops: the search box, the rail (or the
 * first list), the values and Clear. Tab and Shift+Tab cycle through them (a trap); the arrow keys
 * move inside a Menu (the Menu does that); Right enters the values from the rail and Left goes back.
 */
function stops(root: HTMLElement): HTMLElement[] {
  const found: HTMLElement[] = []
  const search = root.querySelector<HTMLElement>('input')
  if (search) found.push(search)
  for (const menu of root.querySelectorAll<HTMLElement>('[role="menu"]')) {
    const target =
      menu.querySelector<HTMLElement>(`${ITEM}[data-selected]`) ??
      menu.querySelector<HTMLElement>(ITEM)
    if (target) found.push(target)
  }
  const clear = root.querySelector<HTMLElement>('[data-testid="picker-clear"]')
  if (clear) found.push(clear)
  return found
}

/** A definition of a dimension: the real `MenuItem` at the loose density, the real selected state. */
function Definition(props: {
  dimension: string
  title: string
  testId: string
  selected: boolean
  onClick: () => void
  trailing?: string
  /** Why a search found it, when not by its title ("Matches audience: students", "Matches ID"). */
  reason?: string
}) {
  return (
    <MenuItem
      __unstable_subtitle={props.reason}
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
  /** The ID of the definition behind a value, so search can match it (whole or from its start). */
  idOf?: (dimension: string, key: string) => string | undefined
}) {
  const {dimensions, chosen, onPick, idOf} = props
  const form = panelForm(dimensions.length)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(
    props.start ?? dimensions.find((d) => !chosen[d.name])?.name ?? dimensions[0]?.name,
  )
  const spec = dimensions.find((d) => d.name === active) ?? dimensions[0]
  const rootRef = useRef<HTMLDivElement | null>(null)
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const root = rootRef.current
    if (!root) return
    const here = document.activeElement as HTMLElement | null
    if (event.key === 'Tab') {
      const all = stops(root)
      // The current stop is the one that holds focus, or the Menu whose item holds it.
      const at = all.findIndex((el) => el === here || el.closest('[role="menu"]')?.contains(here))
      const next = event.shiftKey ? at - 1 : at + 1
      event.preventDefault()
      all[(next + all.length) % all.length]?.focus()
    } else if (event.key === 'ArrowDown' && here?.tagName === 'INPUT') {
      // From the search box into the first Menu: the rail, or the first list.
      const first = stops(root).find((el) => el.matches(ITEM))
      if (first) {
        event.preventDefault()
        first.focus()
      }
    } else if (event.key === 'ArrowRight' && here?.closest('[data-testid="picker-rail"]')) {
      // From the rail into the values of the active dimension.
      const values = root.querySelector<HTMLElement>(`[data-testid^="list-"] ${ITEM}`)
      if (values) {
        event.preventDefault()
        values.focus()
      }
    } else if (event.key === 'ArrowLeft' && here?.closest('[data-testid^="list-"]')) {
      const rail = root.querySelector<HTMLElement>(
        `[data-testid="picker-rail"] ${ITEM}[data-selected]`,
      )
      if (rail) {
        event.preventDefault()
        rail.focus()
      }
    }
  }
  // The rail follows the keyboard: when an arrow key moves focus to a rail item, that item is the
  // active dimension, so the highlight and the list on the right never disagree. (Pointer hover
  // also focuses a Menu item; only keyboard focus counts here.)
  const byKeyboard = useRef(false)
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const id = (event.target as HTMLElement).dataset.testid
    if (byKeyboard.current && id?.startsWith('picker-dimension-')) {
      setActive(id.slice('picker-dimension-'.length))
    }
  }
  // The search box takes focus on open. The Menus below would otherwise move it to their first
  // item as they mount, so it is set again after they have.
  useEffect(() => {
    const focus = () => rootRef.current?.querySelector<HTMLElement>('input')?.focus()
    focus()
    const timer = setTimeout(focus, 50)
    return () => clearTimeout(timer)
  }, [])
  // The arrow keys inside a Menu are handled here, not by the Menu: in the live Studio the Menu moves
  // its own highlight (`activeIndex`) but not DOM focus, so the highlight, the focus and the rail's
  // active dimension could each be on a different item. Stopping the key in the capture phase keeps
  // the Menu from seeing it; the item gets real focus, and in the rail it also becomes the active
  // dimension.
  const moveInMenu = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    const here = event.target as HTMLElement
    const menu = here.closest<HTMLElement>('[role="menu"]')
    if (!menu) return
    const items = [...menu.querySelectorAll<HTMLElement>(ITEM)]
    const at = items.indexOf(here.closest<HTMLElement>(ITEM) as HTMLElement)
    if (!items.length) return
    event.preventDefault()
    event.stopPropagation()
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? items.length - 1
          : (at + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length
    items[next]?.focus()
    const id = items[next]?.dataset.testid
    if (id?.startsWith('picker-dimension-')) setActive(id.slice('picker-dimension-'.length))
  }
  const searching = !!query.trim()
  const any = Object.keys(chosen).length > 0
  // The open beta search rule (./search): titles, then conditions (shown with the value's title), then IDs, with the reason under the rest.
  const ranked = (d: DimensionSpec) =>
    rankSearch(d.values, query, ([key, title]) => ({
      title,
      condition: {dimension: d.name, value: title},
      id: idOf?.(d.name, key),
    })).map(({item: [key, title], reason}, rank) => ({key, title, reason, score: rank}))
  const hits = searching
    ? dimensions
        .flatMap((d) => ranked(d).map((hit) => ({d, ...hit})))
        .sort((x, y) => x.score - y.score)
    : []
  const values = ranked
  const list = (d: DimensionSpec, withDefault?: boolean) => (
    <Menu
      shouldFocus={null}
      data-testid={`list-${d.name}`}
      padding={0}
      style={{maxHeight: LIST_MAX, overflowY: 'auto'}}
    >
      {withDefault && matches(DEFAULT_LABEL, query) ? (
        <MenuItem
          data-testid={`picker-default-${d.name}`}
          onClick={() => onPick(d.name, null)}
          pressed={!chosen[d.name]}
          selected={!chosen[d.name]}
          text={DEFAULT_LABEL}
        />
      ) : null}
      {values(d).map(({key, title, reason}) => (
        <Definition
          dimension={d.name}
          key={key}
          onClick={() => onPick(d.name, key)}
          reason={reason}
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
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      // Capture: the Menu stops the arrow keys from bubbling.
      onKeyDownCapture={(event) => {
        byKeyboard.current = true
        moveInMenu(event)
      }}
      onPointerMove={() => {
        byKeyboard.current = false
      }}
      ref={rootRef}
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
            <Menu shouldFocus={null} padding={0} style={{maxHeight: LIST_MAX, overflowY: 'auto'}}>
              {hits.map(({d, key, title, reason}) => (
                <Definition
                  dimension={d.name}
                  key={`${d.name}-${key}`}
                  onClick={() => onPick(d.name, key)}
                  reason={reason}
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
              <Menu
                shouldFocus={null}
                data-testid="picker-rail"
                padding={0}
                style={{width: RAIL_WIDTH, flex: 'none'}}
              >
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
          {/* One dimension is a flat list with a Default row: nothing under it. The other forms keep Clear (and the save stub). */}
          {form !== 'list' && (any || form === 'columns') ? (
            <Card borderTop data-testid="picker-footer" paddingTop={2}>
              <Flex align="center" gap={2}>
                <Box flex={1} />
                {form === 'columns' ? (
                  <Button
                    data-testid="picker-save-composite"
                    disabled
                    mode="bleed"
                    text={SAVE_AS_COMPOSITE_LABEL}
                    tooltipProps={{content: SAVE_AS_COMPOSITE_REASON}}
                  />
                ) : null}
                {any ? (
                  <Button
                    data-testid="picker-clear"
                    mode="bleed"
                    onClick={props.onClear}
                    text="Clear"
                    tooltipProps={null}
                  />
                ) : null}
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
  idOf?: (dimension: string, key: string) => string | undefined
}) {
  return (
    <MenuPopover
      anchor={props.anchor}
      arrows={false}
      onDismiss={props.onClose}
      open={props.open}
      placement={props.placement}
      testId={props.testId ?? 'address-picker-popover'}
      width={panelWidth(props.dimensions.length)}
    >
      <PickerContent
        chosen={props.chosen}
        dimensions={props.dimensions}
        idOf={props.idOf}
        onClear={props.onClear}
        onPick={props.onPick}
        start={props.start}
      />
    </MenuPopover>
  )
}
