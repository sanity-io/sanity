// Ported from Andrej's version inventory side panel in the Storybook Variants 2.0 branch (sanity-labs/sanity-studio-storybook,
// explorations/variants-2-0, commit db53306896, lib/explorations/variants/inventory-concepts/InventoryMenus.tsx).
// Changes: imports point at this monorepo and ./fixtures (a LIVE replacement of his fixtures); LIVE: marks other changes.
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {Dialog} from '../../../../packages/sanity/src/ui-components/dialog/Dialog'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {
  MenuGroup,
  type MenuGroupProps,
} from '../../../../packages/sanity/src/ui-components/menuGroup/MenuGroup'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'

import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {FilterIcon} from '@sanity/icons/Filter'
import {SortIcon} from '@sanity/icons/Sort'
import {UserIcon} from '@sanity/icons/User'
import {Box, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {useToast} from '@sanity/ui/toast'
import {type FormEvent, type ReactNode, useEffect, useId, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {PEOPLE, worldDimensions} from './fixtures'
import {
  type GroupBy,
  bundleOptions,
  type Filter,
  filterKey,
  type InventoryView,
  MATCH_FILTER_LABELS,
  type MatchFilter,
  sameFilter,
  type DateFilter,
  type DateKind,
  dateShortcuts,
  dateValueLabel,
  UNASSIGNED,
  personLabel,
  type SavedView,
  STAGE_FILTER_LABELS,
  type SortBy,
  type SortOrder,
  useInventoryConcepts,
  VIEW_LABELS,
} from './model'

/**
 * The inventory's menus: Views (under the view button), Sort (⇅), View settings (⋯) with its
 * Group by submenu, and the filter picker. Every one is Studio's `MenuButton` / `MenuItem` /
 * `MenuGroup`; section headers repeat the small muted label of Studio's variant menu.
 */

export const NOT_DESIGNED = {content: 'Not designed yet'}
const noop = () => undefined

function Section({children}: {children: ReactNode}) {
  return (
    <Box paddingX={3} paddingTop={3} paddingBottom={2}>
      <Text muted size={0} weight="medium">
        {children}
      </Text>
    </Box>
  )
}

/**
 * A filter option's count, after its label in the muted grey of the group headers' secondary text
 * (Andrej, 2026-10-15: "make the bracketed numbers in grey tone"). Studio's `MenuItem` takes text as
 * a string, so the label is drawn through its `renderMenuItem` hook, in the same size and weight.
 */
function CountedLabel(props: {text: string; count: number; checked?: boolean; muted?: boolean}) {
  const {text, count, checked, muted} = props
  return (
    <Flex align="center" gap={2}>
      <Box flex={1}>
        <Text muted={muted} size={1} textOverflow="ellipsis" weight="medium">
          {text}{' '}
          <span style={{color: 'var(--card-muted-fg-color)', fontWeight: 400}}>({count})</span>
        </Text>
      </Box>
      {checked && (
        <Flex align="center" marginLeft={3}>
          <Text size={1}>
            <CheckmarkIcon />
          </Text>
        </Flex>
      )}
    </Flex>
  )
}

function Check({
  checked,
  onClick,
  text,
  count,
  disabled,
}: {
  checked?: boolean
  onClick?: () => void
  text: string
  /** How many versions the option would list; shown in grey after the label. */
  count?: number
  disabled?: boolean
}) {
  // An option that would list nothing is greyed out and cannot be picked (Andrej, 2026-10-15: "You
  // can grey them out"); one already chosen stays live.
  const empty = count === 0 && !checked
  return (
    // The checkmark marks every chosen item, as Studio's pane menus do: the highlight alone shows only
    // one per menu, so Publish date and Ascending could not both read as chosen.
    <MenuItem
      disabled={disabled || empty}
      iconRight={checked ? CheckmarkIcon : undefined}
      onClick={onClick ?? noop}
      pressed={checked}
      selected={checked}
      renderMenuItem={
        count === undefined
          ? undefined
          : () => <CountedLabel checked={checked} count={count} muted={empty} text={text} />
      }
      text={text}
      tooltipProps={onClick ? undefined : NOT_DESIGNED}
    />
  )
}

const VIEW_ORDER: InventoryView[] = ['publishDate', 'stage', 'priority']
/** The views menu says what By priority ranks for. */
const VIEW_MENU_LABELS: Record<InventoryView, string> = {
  ...VIEW_LABELS,
  priority: 'By priority for this perspective',
}

/** A saved view's ⋯ shows on hover and focus, and while its menu is open. */
const SavedViewRow = styled(Flex)`
  .saved-view-actions {
    opacity: 0;
  }
  &:hover .saved-view-actions,
  &:focus-within .saved-view-actions,
  .saved-view-actions:has([aria-expanded='true']) {
    opacity: 1;
  }
`

/**
 * A saved view in the views menu, with a ⋯ that deletes it. Delete takes effect at once and offers
 * Undo in a toast, which puts the view back where it was.
 */
function SavedViewItem({saved}: {saved: SavedView}) {
  const {savedViewId, selectSavedView, deleteSavedView} = useInventoryConcepts()
  const toast = useToast()
  const onDelete = () => {
    const undo = deleteSavedView(saved.id)
    const toastId = `saved-view-deleted-${saved.id}`
    toast.push({
      id: toastId,
      closable: true,
      status: 'info',
      title: 'View deleted',
      description: (
        <Button
          mode="bleed"
          onClick={() => {
            undo()
            toast.push({id: toastId, status: 'success', title: 'View restored', duration: 3000})
          }}
          text="Undo"
        />
      ),
    })
  }
  return (
    <SavedViewRow align="center" data-testid={`inventory-saved-view-${saved.id}`}>
      <Box flex={1} style={{minWidth: 0}}>
        <Check
          checked={saved.id === savedViewId}
          onClick={() => selectSavedView(saved.id)}
          text={saved.name}
        />
      </Box>
      <Box className="saved-view-actions" paddingRight={1}>
        <MenuButton
          button={
            <Button
              aria-label={`Actions for ${saved.name}`}
              icon={EllipsisHorizontalIcon}
              mode="bleed"
              tooltipProps={null}
            />
          }
          id={`inventory-saved-view-actions-${saved.id}`}
          menu={
            <Menu>
              <MenuItem onClick={onDelete} text="Delete view" tone="critical" />
            </Menu>
          }
          popover={{placement: 'right-start', portal: true}}
        />
      </Box>
    </SavedViewRow>
  )
}

/** Names the current view, filters and sort, and keeps them as a saved view. */
function SaveViewDialog({onClose}: {onClose: () => void}) {
  const {saveView} = useInventoryConcepts()
  const [name, setName] = useState('')
  const inputId = useId()
  const trimmed = name.trim()
  const save = (event?: FormEvent) => {
    event?.preventDefault()
    if (!trimmed) return
    saveView(trimmed)
    onClose()
  }
  return (
    <Dialog
      footer={{
        confirmButton: {disabled: !trimmed, onClick: () => save(), text: 'Save', tone: 'primary'},
      }}
      header="Save view"
      id="inventory-save-view-dialog"
      onClose={onClose}
      width={1}
    >
      <form onSubmit={save}>
        <Stack gap={3}>
          <Text as="label" htmlFor={inputId} size={1} weight="medium">
            Name
          </Text>
          <TextInput
            autoFocus
            id={inputId}
            onChange={(e) => setName(e.currentTarget.value)}
            value={name}
          />
        </Stack>
      </form>
    </Dialog>
  )
}

export function ViewsMenu() {
  const {view, setView, savedViews, savedViewId, viewLabel} = useInventoryConcepts()
  const [saving, setSaving] = useState(false)
  return (
    <>
      <MenuButton
        button={
          <Button
            data-testid="inventory-view-menu"
            iconRight={ChevronDownIcon}
            mode="bleed"
            text={viewLabel}
          />
        }
        id="inventory-view-menu"
        menu={
          <Menu>
            <Section>Views</Section>
            {VIEW_ORDER.map((option) => (
              <Check
                checked={!savedViewId && option === view}
                key={option}
                onClick={() => setView(option)}
                text={VIEW_MENU_LABELS[option]}
              />
            ))}
            <MenuDivider />
            <Section>Saved views</Section>
            {savedViews.map((saved) => (
              <SavedViewItem key={saved.id} saved={saved} />
            ))}
            <MenuDivider />
            <Check onClick={() => setSaving(true)} text="Save current view…" />
          </Menu>
        }
        popover={{placement: 'bottom-start', portal: true}}
      />
      {saving && <SaveViewDialog onClose={() => setSaving(false)} />}
    </>
  )
}

const SORT_LABELS: Record<SortBy, string> = {
  lastEdited: 'Last edited',
  name: 'Name',
  publishDate: 'Publish date',
  priority: 'Priority',
}
/** Ascending and descending, not newest and oldest: the order applies to every sort, names included. */
const ORDER_LABELS: Record<SortOrder, string> = {asc: 'Ascending', desc: 'Descending'}

/**
 * By priority orders rows by who is served, so Group by has nothing to change there: it is disabled
 * in that view and says why (Captain's consistency call, 2026-10-15). Its Sort offers Priority
 * alone, ascending or descending, and starts on Descending, the serving order (Andrej, 2026-10-19:
 * "In the priority view we may want to sort by priority ascending or descending").
 */
const PRIORITY_RANKS = {content: 'By priority groups by who is served'}

// An element, not a component: MenuButton clones it to add its click handler and ARIA state.
const SORT_BUTTON = (
  <Button
    aria-label="Sort"
    tooltipProps={{content: 'Sort'}}
    data-testid="inventory-sort-menu"
    icon={SortIcon}
    mode="bleed"
  />
)

export function SortMenu() {
  const {sort, setSort, priorityOrder, setPriorityOrder, view} = useInventoryConcepts()
  const priorityView = view === 'priority'
  // Choosing a sort keeps the order already set; Descending when none is.
  const sortBy = (by: SortBy) => setSort({by, order: sort?.order ?? 'desc'})
  const orderBy = (order: SortOrder) => setSort({by: sort?.by ?? 'lastEdited', order})
  const sortOptions: SortBy[] = priorityView ? ['priority'] : (Object.keys(SORT_LABELS) as SortBy[])
  return (
    <MenuButton
      button={SORT_BUTTON}
      id="inventory-sort-menu"
      menu={
        <Menu>
          <Section>Sort by</Section>
          {sortOptions.map((by) => (
            <Check
              checked={priorityView || sort?.by === by}
              key={by}
              onClick={priorityView ? () => undefined : () => sortBy(by)}
              text={SORT_LABELS[by]}
            />
          ))}
          <MenuDivider />
          <Section>Order</Section>
          {(Object.keys(ORDER_LABELS) as SortOrder[]).map((order) => (
            <Check
              checked={(priorityView ? priorityOrder : sort?.order) === order}
              key={order}
              onClick={priorityView ? () => setPriorityOrder(order) : () => orderBy(order)}
              text={ORDER_LABELS[order]}
            />
          ))}
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}

const GROUP_LABELS: Record<GroupBy, string> = {
  release: 'Publish date',
  language: 'Language',
  audience: 'Audience',
  experiment: 'Experiment',
  none: 'None',
}

/** ⋯ in the toolbar: View settings, with Group by as a submenu. */
export function ViewSettingsMenu({extraItems}: {extraItems?: ReactNode}) {
  const {groupBy, setGroupBy, view} = useInventoryConcepts()
  return (
    <MenuButton
      button={
        <Button
          aria-label="View settings"
          tooltipProps={{content: 'View settings'}}
          data-testid="inventory-view-settings"
          icon={EllipsisHorizontalIcon}
          mode="bleed"
        />
      }
      id="inventory-view-settings"
      menu={
        <Menu>
          {extraItems}
          <Section>View settings</Section>
          <MenuGroup
            data-testid="inventory-group-by"
            disabled={view === 'priority'}
            popover={{placement: 'left-start'}}
            tooltipProps={view === 'priority' ? PRIORITY_RANKS : undefined}
            // Reads as a phrase, "Group by publish date" (Andrej, 2026-10-15); None reads "No grouping".
            text={
              groupBy === 'none' ? 'No grouping' : `Group by ${GROUP_LABELS[groupBy].toLowerCase()}`
            }
          >
            {(['release', 'language', 'audience', 'experiment'] as GroupBy[]).map((option) => (
              <Check
                checked={groupBy === option}
                key={option}
                onClick={() => setGroupBy(option)}
                text={GROUP_LABELS[option]}
              />
            ))}
            <MenuDivider />
            <Check checked={groupBy === 'none'} onClick={() => setGroupBy('none')} text="None" />
          </MenuGroup>
          <Check text="Show empty groups" />
          <MenuDivider />
          <Check text="Open in Variants tool" />
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}

type FilterOption = [string, Filter]

/** The grey that counts and a group's chosen value share. */
const GREY = {color: 'var(--card-muted-fg-color)', fontWeight: 400}

/** Submenus open to the right, and to the left where the panel meets the window's edge. */
const SUBMENU_POPOVER: MenuGroupProps['popover'] = {
  placement: 'right-start',
  fallbackPlacements: ['left-start'],
  portal: true,
}

/**
 * One kind of filter as a submenu (Andrej, 2026-10-15: "for these filters, we might need to
 * implement some sort of a pattern that when these lists get very long, we actually have like
 * secondary menus … redesign the filters from ground up in all the views"). The trigger names the
 * kind and, in grey, the value chosen; the submenu lists the options with their counts.
 */
function FilterGroup(props: {
  title: string
  options: FilterOption[]
  /** The value chosen outside the options, such as a date picked on the calendar. */
  chosen?: string
  /** A search field over the options, for lists of people that can run to hundreds. */
  search?: {placeholder: string}
  testId: string
  children?: ReactNode
}) {
  const {title, options, chosen, search, testId, children} = props
  const {addFilter, filters, countWith} = useInventoryConcepts()
  const value =
    options.find(([, option]) => filters.some((f) => sameFilter(f, option)))?.[0] ?? chosen
  const item = ([text, option]: FilterOption) => (
    <Check
      checked={filters.some((f) => sameFilter(f, option))}
      count={countWith(option)}
      key={`${filterKey(option)}-${text}`}
      onClick={() => addFilter(option)}
      text={text}
    />
  )
  return (
    <MenuGroup
      data-testid={testId}
      popover={SUBMENU_POPOVER}
      text={
        <>
          {title}
          {value && <span style={GREY}> · {value}</span>}
        </>
      }
    >
      {search ? (
        <SearchableOptions
          options={options}
          placeholder={search.placeholder}
          renderItem={item}
          testId={testId}
        />
      ) : (
        options.map(item)
      )}
      {children}
    </MenuGroup>
  )
}

/** A date kind's submenu: the shortcuts, then Specific date, which opens the calendar. */
function DateFilterGroup({kind, title}: {kind: DateKind; title: string}) {
  const {filters, setDatePicker} = useInventoryConcepts()
  const shortcuts = dateShortcuts(kind)
  const current = filters.find((f): f is DateFilter => f.kind === kind)
  const specific = current !== undefined && !shortcuts.some(([, f]) => sameFilter(f, current))
  return (
    <FilterGroup
      chosen={specific ? dateValueLabel(current) : undefined}
      options={shortcuts}
      testId={`inventory-filter-group-${kind}`}
      title={title}
    >
      <MenuDivider />
      <Check checked={specific} onClick={() => setDatePicker(kind)} text="Specific date…" />
    </FilterGroup>
  )
}

/**
 * Studio's assignee picker (Tasks, `AssigneeSelectionMenu`): a borderless field with the user icon,
 * focused when the submenu opens, typing anywhere in it lands in the field, the list scrolls past
 * 320 px, and "No users found" when nothing matches (Andrej, 2026-10-15: "For the person selection,
 * please add a search bar as there can be hundreds of people").
 */
function SearchableOptions(props: {
  options: FilterOption[]
  placeholder: string
  renderItem: (option: FilterOption) => ReactNode
  testId: string
}) {
  const {options, placeholder, renderItem, testId} = props
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  // The submenu focuses its first item on open; the field takes focus once that has settled.
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])
  const needle = query.trim().toLowerCase()
  // A person matches by the label shown and by their name, so "Doug" finds the row that says "Me".
  const words = ([text, option]: FilterOption) =>
    'person' in option ? `${text} ${PEOPLE.find((p) => p.id === option.person)?.name ?? ''}` : text
  const shown = needle
    ? options.filter((option) => words(option).toLowerCase().includes(needle))
    : options
  return (
    <div
      onKeyDown={(event) => {
        if (event.target !== inputRef.current && !NAVIGATION_KEYS.includes(event.key)) {
          inputRef.current?.focus()
        }
      }}
    >
      <TextInput
        autoComplete="off"
        border={false}
        data-testid={`${testId}-search`}
        fontSize={1}
        icon={UserIcon}
        onChange={(event) => setQuery(event.currentTarget.value)}
        placeholder={placeholder}
        ref={inputRef}
        value={query}
      />
      <div style={{maxHeight: 320, overflowY: 'auto', paddingTop: 8}}>
        {shown.length > 0 ? (
          shown.map(renderItem)
        ) : (
          <Box padding={3}>
            <Text align="center" muted size={1}>
              No users found
            </Text>
          </Box>
        )}
      </div>
    </div>
  )
}

/** Keys that move through the menu rather than type into the search field. */
const NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab', 'Shift', 'Home', 'End']

/** People as filter options: the signed-in user first, as "Me". */
const peopleOptions = (kind: 'assignee' | 'editedBy'): FilterOption[] =>
  PEOPLE.map((p) => [personLabel(p.id), {kind, person: p.id}])

/** Each view's own filter kinds; the dimensions follow in every view. */
function ViewFilterGroups() {
  const {view, world} = useInventoryConcepts()
  if (view === 'publishDate') return <DateFilterGroup kind="publishDate" title="Publish date" />
  if (view === 'stage') {
    return (
      <>
        <FilterGroup
          options={(
            Object.entries(STAGE_FILTER_LABELS) as [keyof typeof STAGE_FILTER_LABELS, string][]
          ).map(([stage, text]) => [text, {kind: 'stage', stage}])}
          testId="inventory-filter-group-stage"
          title="Stage"
        />
        {/* Studio's Tasks name the person a draft is assigned to "Assignee", and the one with
            none "Unassigned"; the Releases tool's table heads its editor column "Edited by". */}
        <FilterGroup
          options={[
            ...peopleOptions('assignee'),
            ['Unassigned', {kind: 'assignee', person: UNASSIGNED}],
          ]}
          search={{placeholder: 'Select assignee'}}
          testId="inventory-filter-group-assignee"
          title="Assignee"
        />
        <FilterGroup
          options={peopleOptions('editedBy')}
          search={{placeholder: 'Select user'}}
          testId="inventory-filter-group-editedBy"
          title="Edited by"
        />
        <DateFilterGroup kind="lastEdited" title="Last edited" />
      </>
    )
  }
  return (
    <>
      <FilterGroup
        options={(Object.entries(MATCH_FILTER_LABELS) as [MatchFilter, string][]).map(
          ([match, text]) => [text, {kind: 'match', match}],
        )}
        testId="inventory-filter-group-match"
        title="Match for this visitor"
      />
      <FilterGroup
        options={bundleOptions(world).map(([text, bundle]) => [text, {kind: 'bundle', bundle}])}
        testId="inventory-filter-group-bundle"
        title="Release"
      />
    </>
  )
}

/**
 * The toolbar's filter icon, selected while filters are set, and "+ Add filter" in the filter bar:
 * one short list of filter kinds, each a submenu. The view's own kinds come first (Publish date; Stage, Assignee, Edited by, Last edited;
 * Match for this visitor, Release), then Language, Audience and Experiment in every view.
 */
export function FilterMenu({button}: {button?: ReactNode}) {
  const {filters, world} = useInventoryConcepts()
  return (
    <MenuButton
      button={
        (button as React.JSX.Element) ?? (
          <Button
            aria-label="Filter"
            tooltipProps={{content: 'Filter'}}
            data-testid="inventory-filter-menu"
            icon={FilterIcon}
            mode="bleed"
            selected={filters.length > 0}
          />
        )
      }
      id="inventory-filter-menu"
      menu={
        <Menu>
          <ViewFilterGroups />
          <MenuDivider />
          {worldDimensions(world).map((dimension) => (
            <FilterGroup
              key={dimension.name}
              options={dimension.values.map((option) => [
                option.title,
                {kind: 'dimension', dimension: dimension.name, value: option.value},
              ])}
              testId={`inventory-filter-group-${dimension.name}`}
              title={dimension.title}
            />
          ))}
        </Menu>
      }
      popover={{placement: 'bottom-end', portal: true}}
    />
  )
}
