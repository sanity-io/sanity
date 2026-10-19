// Ported from Andrej's version inventory side panel in the Storybook Variants 2.0 branch (sanity-labs/sanity-studio-storybook,
// explorations/variants-2-0, commit db53306896, lib/explorations/variants/inventory-concepts/VersionInventoryPanel.tsx).
// Changes: imports point at this monorepo and ./fixtures (a LIVE replacement of his fixtures); LIVE: marks other changes.
import {DocumentVersionsStatusIndicator} from '../../../../packages/sanity/src/core/components/documentStatusIndicator/DocumentVersionsStatusIndicator'
import {VariantCheckbox} from '../../../../packages/sanity/src/core/documentGroupInventory/components/VariantSet/VariantCheckbox'
import {VariantSetEntry} from '../../../../packages/sanity/src/core/documentGroupInventory/components/VariantSet/VariantSetEntry'
import {type PerspectiveContextValue} from '../../../../packages/sanity/src/core/perspective/types'
import {usePerspective} from '../../../../packages/sanity/src/core/perspective/usePerspective'
import {ReleaseAvatarIcon} from '../../../../packages/sanity/src/core/releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../../../packages/sanity/src/core/releases/store/types'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Popover} from '../../../../packages/sanity/src/ui-components/popover/Popover'

import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {CloseIcon} from '@sanity/icons/Close'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {ExpandIcon} from '@sanity/icons/Expand'
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Flex, Stack, Text, useClickOutsideEvent} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {DateSpanPicker} from './DateSpanPicker'
import {documentsFor, variantsOn, worldDocument, worldVariants} from './fixtures'
import {FilterMenu, NOT_DESIGNED, SortMenu, ViewSettingsMenu, ViewsMenu} from './InventoryMenus'
import {
  filterKey,
  filterLabel,
  type InventoryGroup,
  type InventoryRow,
  useInventoryConcepts,
} from './model'

/**
 * The version inventory, the same in every concept: a header, a view toolbar, and the versions
 * grouped by release (or by a dimension, or not at all), each row one stored version.
 *
 * Built from Studio parts where one exists: rows are `VariantSetEntry` (the Manage versions row
 * chrome) with its `VariantCheckbox`, group icons are `ReleaseAvatarIcon`, a row's status icons are
 * `DocumentVersionsStatusIndicator`, and every control is Studio's
 * `Button` / `MenuButton` / `MenuItem` / `MenuGroup`.
 *
 * Choosing a row sets the perspective bar to that row's release and variant. Controls whose result
 * the board does not draw render and do nothing; their tooltip says so.
 */

const noop = () => undefined

/** The group header's secondary style: muted, regular weight. */
const SECONDARY = {color: 'var(--card-muted-fg-color)', fontWeight: 400}

/** Checkboxes show on hover and focus, and on every row once anything is selected. */
const RowShell = styled.div`
  .inventory-checkbox {
    opacity: 0;
    position: relative;
    z-index: 1;
  }
  [data-ui='VariantSetEntry']:hover .inventory-checkbox,
  .inventory-group:hover .inventory-checkbox,
  .inventory-checkbox:focus-within,
  &[data-selecting] .inventory-checkbox {
    opacity: 1;
  }
  /* A group header's icon shares the checkbox's slot and gives way to it on hover, so the header's
     title starts where every row's text does. */
  .inventory-group-slot {
    position: relative;
    display: flex;
    flex: none;
  }
  .inventory-group-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .inventory-group:hover .inventory-group-icon,
  .inventory-group:focus-within .inventory-group-icon,
  &[data-selecting] .inventory-group-icon {
    opacity: 0;
  }
  &[data-narrow]:not([data-selecting]) .inventory-group:hover .inventory-group-icon {
    opacity: 1;
  }
  /* A collapsed header is followed by another header, not a row, so it draws the divider a row would:
     the 1 px line Studio's VariantSetEntry draws above each row. */
  .inventory-group[data-collapsed] {
    border-block-end: 1px solid var(--card-border-color);
  }
  /* At 240 px a hidden checkbox costs a third of the row; it takes no width until selecting. It
     keeps its height, so a group header is as tall before the first tick as after it and the list
     does not move. */
  &[data-narrow]:not([data-selecting]) .inventory-checkbox {
    width: 0;
    overflow: hidden;
    visibility: hidden;
  }
  /* Rows and group titles keep one line each, truncated, so 240 px reads as a list. */
  .inventory-row-text {
    flex: 1;
    min-width: 0;
  }
`

function PlaceholderIconButton({icon, label}: {icon: ComponentType; label: string}) {
  return (
    <Button
      aria-label={label}
      icon={icon}
      mode="bleed"
      onClick={noop}
      tooltipProps={NOT_DESIGNED}
    />
  )
}

/**
 * The filter bar under the toolbar, and the bulk bar in the toolbar's place. Each takes the panel's
 * own scheme in a neutral tone, so it reads as a bar in light and dark alike (Andrej, 2026-10-15: "Both
 * modes need to work"); it used to invert the scheme and turned white in dark mode.
 */
function ModeBar({children, testId}: {children: ReactNode; testId: string}) {
  return (
    <Card data-testid={testId} paddingX={3} paddingY={2} tone="neutral">
      <Flex align="center" gap={2} wrap="wrap">
        {children}
      </Flex>
    </Card>
  )
}

function PanelHeader() {
  const {world} = useInventoryConcepts()
  return (
    <Flex
      align="center"
      data-testid="inventory-header"
      gap={2}
      paddingLeft={4}
      paddingRight={3}
      paddingY={3}
    >
      <Box flex={1}>
        <Text size={2} textOverflow="ellipsis" weight="semibold">
          Versions of {worldDocument(world).title}
        </Text>
      </Box>
      {/* Leads to the Variants tool (Andrej, 2026-10-14); the prototype names it, the click is not wired. */}
      <Button
        aria-label="Open in Variants tool"
        icon={ExpandIcon}
        mode="bleed"
        onClick={noop}
        tooltipProps={{content: 'Open in Variants tool'}}
      />
      <PlaceholderIconButton icon={CloseIcon} label="Close" />
    </Flex>
  )
}

/**
 * The bar along the panel's bottom edge, on the row of the Document status bar beside it, with
 * Create variant right-aligned as Publish is (Andrej, 2026-10-14). Its box repeats the status bar's:
 * 4 px around a card with 8 px padding, 49 px in all, no top border.
 */
function PanelFooter() {
  const {world} = useInventoryConcepts()
  // With variants off there is nothing to create here, and the bottom bar goes.
  if (!variantsOn(world)) return null
  return (
    <Box data-testid="inventory-footer" padding={1}>
      <Card padding={2}>
        <Flex justify="flex-end">
          <Button
            icon={AddIcon}
            mode="ghost"
            onClick={noop}
            text="Create variant"
            tooltipProps={NOT_DESIGNED}
          />
        </Flex>
      </Card>
    </Box>
  )
}

/** The narrow toolbar (concept C) keeps view · search · filter; sort and grouping move to ⋯. */
function Toolbar({narrow}: {narrow: boolean}) {
  return (
    <Flex
      align="center"
      data-testid="inventory-toolbar"
      gap={narrow ? 0 : 1}
      paddingX={narrow ? 2 : 3}
      paddingY={2}
    >
      <ViewsMenu />
      <Box flex={1} />
      <PlaceholderIconButton icon={SearchIcon} label="Search" />
      <FilterMenu />
      {!narrow && <SortMenu />}
      {!narrow && <ViewSettingsMenu />}
    </Flex>
  )
}

/**
 * The filter bar sits under the toolbar while any filter is set, and goes when the last one is
 * removed; the toolbar never gives way to it (Andrej, 2026-10-19: "we never kind of like remove the
 * view selector and override it, we just show the filter bar under it … people would be choosing
 * the save view from the view selector menu"). Save view lives in the views menu, so the bar holds
 * the filters, Add filter and Clear filters, and needs no Done. In the 240 px pane Clear filters takes
 * its own line after Add filter, so a chip keeps the width its ✕ needs.
 */
function FilterBar({narrow}: {narrow: boolean}) {
  const {filters, removeFilter, resetFilters, world} = useInventoryConcepts()
  const clear = <Button mode="bleed" onClick={resetFilters} text="Clear filters" />
  return (
    <ModeBar testId="inventory-filter-bar">
      {/* The filters and Add filter wrap on the left; Clear filters stays on the first line, right
          (Andrej, 2026-10-15: "Make the add filter button a secondary button that bleeds into the
          background"). */}
      <Flex align="flex-start" flex={1} gap={2}>
        <Flex align="center" flex={1} gap={2} style={{minWidth: 0}} wrap="wrap">
          {filters.map((filter, index) => (
            <Button
              iconRight={CloseIcon}
              key={filterKey(filter)}
              mode="ghost"
              onClick={() => removeFilter(index)}
              text={filterLabel(filter, world)}
            />
          ))}
          <FilterMenu button={<Button icon={AddIcon} mode="bleed" text="Add filter" />} />
          {narrow && (
            <Box data-testid="inventory-filter-actions" style={{flexBasis: '100%'}}>
              {clear}
            </Box>
          )}
        </Flex>
        {!narrow && (
          <Flex data-testid="inventory-filter-actions" gap={1} style={{flex: 'none'}}>
            {clear}
          </Flex>
        )}
      </Flex>
    </ModeBar>
  )
}

/**
 * The bulk bar takes the toolbar's place while rows are selected, at the toolbar's height, so the
 * list does not move. At 240 px the actions do not fit on that one line: the pane's bulk bar keeps
 * the count, folds Delete into ⋯ and deselects with ✕, and has no Compare.
 */
function BulkBar({narrow}: {narrow: boolean}) {
  const {selectedKeys, clearSelection} = useInventoryConcepts()
  const count = (
    <Text size={1} weight="medium">
      {selectedKeys.size} selected
    </Text>
  )
  if (narrow) {
    return (
      <ModeBar testId="inventory-bulk-bar">
        {count}
        <Box flex={1} />
        <MenuButton
          button={
            <Button
              aria-label="Actions for the selected versions"
              icon={EllipsisHorizontalIcon}
              mode="bleed"
              tooltipProps={null}
            />
          }
          id="inventory-bulk-actions"
          menu={
            <Menu>
              <MenuItem onClick={noop} text="Delete" tone="critical" tooltipProps={NOT_DESIGNED} />
            </Menu>
          }
          popover={{placement: 'bottom-end', portal: true}}
        />
        <Button
          aria-label="Deselect all"
          icon={CloseIcon}
          mode="bleed"
          onClick={clearSelection}
          tooltipProps={{content: 'Deselect all'}}
        />
      </ModeBar>
    )
  }
  return (
    <ModeBar testId="inventory-bulk-bar">
      {count}
      <Button mode="bleed" onClick={noop} text="Compare" tooltipProps={NOT_DESIGNED} />
      <Button
        mode="bleed"
        onClick={noop}
        text="Delete"
        tone="critical"
        tooltipProps={NOT_DESIGNED}
      />
      <Box flex={1} />
      <Button mode="bleed" onClick={clearSelection} text="Deselect all" />
    </ModeBar>
  )
}

/**
 * Clicking a header collapses its group, and clicking again expands it (Andrej, 2026-10-15: "I also
 * want to implement collapsing for these groups when someone clicks on the header"). The checkbox
 * keeps selecting; Enter and Space toggle from the keyboard.
 */
function GroupHeader({
  group,
  collapsed,
  onToggle,
}: {
  group: InventoryGroup
  collapsed: boolean
  onToggle: () => void
}) {
  const {toggleSelected} = useInventoryConcepts()
  const keys = group.rows.map((row) => row.entry.key)
  const allSelected = group.rows.every((row) => row.isSelected)
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle()
    }
  }
  return (
    <Flex
      align="center"
      aria-expanded={!collapsed}
      className="inventory-group"
      data-collapsed={collapsed || undefined}
      data-testid={`inventory-group-${group.id}`}
      gap={3}
      onClick={onToggle}
      onKeyDown={onKeyDown}
      paddingX={3}
      paddingY={2}
      role="button"
      style={{background: 'var(--card-code-bg-color)', cursor: 'pointer', minHeight: 32}}
      tabIndex={0}
    >
      {/* The checkbox selects the group; its click stays out of the header's collapse. */}
      <div className="inventory-group-slot" onClick={(event) => event.stopPropagation()}>
        <VariantCheckbox
          aria-label={`Select ${group.title}`}
          checked={group.rows.length > 0 && allSelected}
          className="inventory-checkbox"
          onChange={() => toggleSelected(keys)}
        />
        {(group.icon || group.glyph) && (
          <span className="inventory-group-icon">
            {group.icon && (
              <Text size={1}>
                <ReleaseAvatarIcon release={group.icon} />
              </Text>
            )}
            {group.glyph && (
              <Text muted size={1}>
                <group.glyph />
              </Text>
            )}
          </span>
        )}
      </div>
      <Box flex={1} style={{minWidth: 0}}>
        <Text size={1} textOverflow="ellipsis" weight="medium">
          <span>{group.title}</span>
          {group.secondary && (
            <span style={SECONDARY}>
              {group.secondaryJoin ?? '  '}
              {group.secondary}
            </span>
          )}
        </Text>
      </Box>
      {/* A small chevron says whether the group is open (Andrej, 2026-10-15: "include a small chevron
          in the header that represents the collapsed or not collapsed state"). */}
      <Text data-testid="inventory-chevron" muted size={1}>
        {collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
      </Text>
    </Flex>
  )
}

/**
 * A row's status icons are Studio's own `DocumentVersionsStatusIndicator`, the schema the Document
 * list pane uses: in a fixed order the variant rhombus, the release icon, the yellow draft ring and
 * the green published disc, at most three (Andrej, 2026-10-15: "should follow the new schema we
 * already use in Studio, where max 2-3 dots appear"). The component describes the selected
 * perspective, so each row hands it its own: the row's release or draft or published, and its
 * variant. A draft and a published row of one variant therefore read alike, as the Document list
 * pane does in Drafts and Published.
 */
function RowStatus({entry}: {entry: InventoryRow['entry']}) {
  const outer = usePerspective()
  const {world} = useInventoryConcepts()
  // A published row shows its published disc and no draft ring: drafts have their own view, By
  // stage, and the ring beside the disc read as the published version having a draft (Andrej,
  // 2026-10-15: "We want to only show one of the published or draft discs in this view. The draft
  // should not be visible as drafts are in another view"). The component is fed the versions
  // without the drafts, so it resolves the published outcome alone.
  const documentVersions = useMemo(
    () =>
      documentsFor(
        entry.group === 'published'
          ? world.entries.filter((other) => other.group !== 'drafts')
          : world.entries,
        world,
      ) as unknown as VersionInfoDocumentStub[],
    [world, entry.group],
  )
  const value = useMemo((): PerspectiveContextValue => {
    const release = world.releases.find((doc) => doc.name === entry.group)
    const variant = entry.variantId
      ? worldVariants(world).find((v) => v._id.endsWith(`.${entry.variantId}`))
      : undefined
    return {
      ...outer,
      bundle: entry.group,
      selectedPerspective: release ?? (entry.group as 'drafts' | 'published'),
      selectedVariant: variant,
      selectedVariantName: entry.variantId,
    }
  }, [outer, world.releases, entry])
  return (
    <PerspectiveContext.Provider value={value}>
      <DocumentVersionsStatusIndicator documentVersions={documentVersions} />
    </PerspectiveContext.Provider>
  )
}

function Row({row}: {row: InventoryRow}) {
  const {selectEntry, toggleSelected} = useInventoryConcepts()
  const highlighted = row.isHere || row.isSelected
  const entry = (
    <VariantSetEntry
      data-here={row.isHere || undefined}
      data-shown={row.isShown || undefined}
      data-testid={`inventory-row-${row.entry.key}`}
      data-ui="VariantSetEntry"
      style={highlighted ? {background: 'var(--card-muted-bg-color)'} : undefined}
    >
      {/* `VariantSetEntry`'s full-row primary action: choosing a row sets the perspective. */}
      <button className="primary-action" onClick={() => selectEntry(row.entry)} type="button">
        {row.title}
      </button>
      <div className="atom" style={{flex: 1, minWidth: 0}}>
        <VariantCheckbox
          aria-label={`Select ${row.title}`}
          checked={row.isSelected}
          className="inventory-checkbox"
          onChange={() => toggleSelected([row.entry.key])}
        />
        {/* `VariantSetEntry` sets `word-break: break-all`, which splits words mid-word here. */}
        <Stack className="inert inventory-row-text" gap={2} style={{wordBreak: 'normal'}}>
          <Text size={1} textOverflow="ellipsis" weight="medium">
            {row.title}
          </Text>
          <Text muted size={1} textOverflow="ellipsis">
            {row.subtitle}
          </Text>
        </Stack>
      </div>
      {/* Right to left: the status icons as the Document list pane draws them, By priority's match. */}
      <Flex align="center" className="inert" gap={2}>
        {row.meta && (
          <Text muted size={1} style={{whiteSpace: 'nowrap'}}>
            {row.meta}
          </Text>
        )}
        {/* Three icons wide and right-aligned, so the published disc keeps one column. */}
        <Flex data-testid="inventory-status" justify="flex-end" style={{width: 45}}>
          <RowStatus entry={row.entry} />
        </Flex>
      </Flex>
    </VariantSetEntry>
  )
  return (
    <>
      {/* The version the form edits, or a selected one, in the primary tone; By priority's winner,
          the version this visitor is shown, in the positive tone (Andrej, 2026-10-15: "a flat list
          with a winning variant being highlighted"). */}
      {highlighted ? (
        <Card tone="primary">{entry}</Card>
      ) : row.isShown ? (
        <Card data-testid="inventory-winner" tone="positive">
          {entry}
        </Card>
      ) : (
        entry
      )}
      {row.fallback && (
        <Box data-testid="inventory-fallback" paddingX={3} paddingY={3}>
          <Text muted size={1}>
            {row.fallback}
          </Text>
        </Box>
      )}
    </>
  )
}

/**
 * The publish-date picker hangs off the toolbar's slot. Picking a date sets a filter and brings the
 * filter bar in under the toolbar; anchored to the slot, the picker stays where it is while the bar
 * comes in. A click outside closes it.
 */
function PublishDatePicker({anchor}: {anchor: HTMLElement | null}) {
  const {datePicker, setDatePicker} = useInventoryConcepts()
  const [picker, setPicker] = useState<HTMLElement | null>(null)
  useClickOutsideEvent(datePicker && (() => setDatePicker(undefined)), () => [picker, anchor])
  return (
    <Popover
      content={
        <Box data-testid="inventory-date-filter" padding={3} ref={setPicker}>
          {datePicker && <DateSpanPicker key={datePicker} kind={datePicker} />}
        </Box>
      }
      open={datePicker !== undefined}
      placement="bottom-end"
      portal
      referenceElement={anchor}
    />
  )
}

/**
 * When the filters leave no row: Studio's search no-results layout (`NoResults`), muted and centred,
 * with a way back (Andrej, 2026-10-15: "We need an empty state where the filter yields no result
 * with the option to reset filters"). Reset removes every filter, and the filter bar goes with them.
 */
function NoMatches() {
  const {resetFilters} = useInventoryConcepts()
  return (
    <Stack
      aria-live="assertive"
      data-testid="inventory-no-matches"
      gap={4}
      paddingX={4}
      paddingY={5}
    >
      <Text align="center" muted size={1} weight="medium">
        No matching versions
      </Text>
      <Text align="center" muted size={1}>
        Change or reset the filters to see more versions.
      </Text>
      <Flex justify="center">
        <Button mode="ghost" onClick={resetFilters} text="Reset filters" />
      </Flex>
    </Stack>
  )
}

/**
 * `wide` is the 480 px panel of concepts A and B, with its own header. `narrow` is concept C's
 * 240 px pane, whose title, ＋ and ⋯ live in Studio's pane header instead.
 */
export function VersionInventoryPanel({layout = 'wide'}: {layout?: 'wide' | 'narrow'}) {
  const {groups, filters, selectedKeys} = useInventoryConcepts()
  const narrow = layout === 'narrow'
  const [filterSlot, setFilterSlot] = useState<HTMLElement | null>(null)
  // Groups whose header was clicked, by id: each turns from its starting state, open unless it
  // starts collapsed. A view's groups keep their state when the editor comes back to it.
  const [toggled, setToggled] = useState<ReadonlySet<string>>(new Set())
  const isCollapsed = (group: InventoryGroup) =>
    (group.defaultCollapsed ?? false) !== toggled.has(group.id)
  const toggleCollapsed = useCallback((id: string) => {
    setToggled((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const noRows = groups.every((group) => group.rows.length === 0)
  return (
    <Flex direction="column" height="fill" data-testid="version-inventory-panel">
      {!narrow && <PanelHeader />}
      {!narrow && <Card borderBottom />}
      {/* One slot for the bar above the list: selecting swaps the toolbar for the bulk bar in
          place, so the rows do not move down when the first row is ticked (Andrej, 2026-10-16:
          "When multi-selecting, the view selector should disappear"). The filter bar stays under
          it, so the filters that narrow the selection stay in view. */}
      <Box ref={setFilterSlot}>
        {/* LIVE: the C4 cover says selecting a row must not swap the toolbar, so the bulk bar is not shown. */}
        <Toolbar narrow={narrow} />
      </Box>
      {filters.length > 0 && <FilterBar narrow={narrow} />}
      <PublishDatePicker anchor={filterSlot} />
      <Box flex={1} overflow="auto">
        <RowShell
          data-narrow={narrow || undefined}
          data-selecting={selectedKeys.size > 0 || undefined}
        >
          {filters.length > 0 && noRows ? (
            <NoMatches />
          ) : (
            groups.map((group) => (
              <div key={group.id}>
                {group.title !== undefined && (
                  <GroupHeader
                    collapsed={isCollapsed(group)}
                    group={group}
                    onToggle={() => toggleCollapsed(group.id)}
                  />
                )}
                {!isCollapsed(group) &&
                  (group.rows.length === 0 && group.emptyText ? (
                    <Box
                      data-testid={`inventory-group-empty-${group.id}`}
                      paddingX={3}
                      paddingY={3}
                    >
                      <Text muted size={1}>
                        {group.emptyText}
                      </Text>
                    </Box>
                  ) : (
                    group.rows.map((row) => <Row key={row.entry.key} row={row} />)
                  ))}
              </div>
            ))
          )}
        </RowShell>
      </Box>
      {!narrow && <PanelFooter />}
    </Flex>
  )
}
