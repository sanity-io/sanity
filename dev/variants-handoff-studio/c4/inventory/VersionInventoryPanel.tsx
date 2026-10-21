import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {CloseIcon} from '@sanity/icons/Close'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {ExpandIcon} from '@sanity/icons/Expand'
import {FilterIcon} from '@sanity/icons/Filter'
import {SearchIcon} from '@sanity/icons/Search'
import {
  Badge,
  type BadgeTone,
  Box,
  Card,
  Flex,
  Stack,
  Text,
  TextInput,
  useClickOutsideEvent,
} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {
  type ComponentType,
  createContext,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {PerspectiveContext} from 'sanity/_singletons'
import {css, styled} from 'styled-components'

// Ported from Andrej's version inventory side panel in the Storybook Variants 2.0 branch (sanity-labs/sanity-studio-storybook,
// explorations/inventory-sidepanel (PR #47), commit 10f3f729a9, lib/explorations/variants/inventory-concepts/VersionInventoryPanel.tsx).
// Changes: imports point at this monorepo and ./fixtures (a LIVE replacement of his fixtures); LIVE: marks other changes.
import {DocumentVersionsStatusIndicator} from '../../../../packages/sanity/src/core/components/documentStatusIndicator/DocumentVersionsStatusIndicator'
import {VariantCheckbox} from '../../../../packages/sanity/src/core/documentGroupInventory/components/VariantSet/VariantCheckbox'
import {VariantSetEntry} from '../../../../packages/sanity/src/core/documentGroupInventory/components/VariantSet/VariantSetEntry'
import {useRelativeTime} from '../../../../packages/sanity/src/core/hooks/useRelativeTime'
import {
  type PerspectiveContextValue,
  type TargetPerspective,
} from '../../../../packages/sanity/src/core/perspective/types'
import {usePerspective} from '../../../../packages/sanity/src/core/perspective/usePerspective'
import {ReleaseAvatarIcon} from '../../../../packages/sanity/src/core/releases/components/ReleaseAvatar'
import {type VersionInfoDocumentStub} from '../../../../packages/sanity/src/core/releases/store/types'
import {getReleaseTone} from '../../../../packages/sanity/src/core/releases/util/getReleaseTone'
import {Button} from '../../../../packages/sanity/src/ui-components/button/Button'
import {Dialog} from '../../../../packages/sanity/src/ui-components/dialog/Dialog'
import {MenuButton} from '../../../../packages/sanity/src/ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {Popover} from '../../../../packages/sanity/src/ui-components/popover/Popover'
import {Tooltip} from '../../../../packages/sanity/src/ui-components/tooltip/Tooltip'
import {CreateVariantForm} from './CreateVariantForm'
import {CreateVariantIcon} from './CreateVariantIcon'
import {DateSpanPicker} from './DateSpanPicker'
import {documentsFor, FIXTURE_NOW, variantsOn, worldDocument, worldVariants} from './fixtures'
import {AddFilterMenu, NOT_DESIGNED, SortMenu, ViewSettingsMenu, ViewsMenu} from './InventoryMenus'
import {
  deleteFallbackText,
  type ServedAnswer,
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

/**
 * The highlight on the version the form edits or a selected one. The row inside it is the first
 * child, so Studio's row rule (a 1 px line above every row that follows another) no longer reaches
 * it; the highlight draws that line itself, in the list's border colour, so selecting a row never
 * moves it (Andrej, 2026-10-20: "When selecting, the top border is removed which causes the row to
 * jump").
 */
const Highlight = styled(Card)(({theme}) => {
  const {color} = getThemeV2(theme)
  return css`
    * + & {
      border-block-start: 1px solid ${color.border};
    }
  `
})

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
  /* A section note starts where the rows' text does: it holds the checkbox's slot, empty, as a
     header does. The slot is the checkbox's 17 px, and folds with it at 240 px. */
  .inventory-note-slot {
    width: 17px;
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
function ModeBar({
  children,
  testId,
  borderBottom,
}: {
  children: ReactNode
  testId: string
  borderBottom?: boolean
}) {
  return (
    <Card borderBottom={borderBottom} data-testid={testId} paddingX={3} paddingY={2} tone="neutral">
      <Flex align="center" gap={2} wrap="wrap">
        {children}
      </Flex>
    </Card>
  )
}

/**
 * Opens storybook-create's create variant form from a create button while no perspective is
 * selected, Drafts with every dimension on All (Andrej, 2026-10-21: "hook up the create variant
 * form to the create variant buttons when no perspective was selected"). With a perspective the
 * buttons keep what they do. Cancel and close give focus back to the button that opened the form.
 */
function useCreateVariantForm(): {
  opensForm: boolean
  open: (event: MouseEvent<HTMLElement>) => void
  form: ReactNode
} {
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  const close = useCallback(() => {
    const button = opener
    setOpener(null)
    requestAnimationFrame(() => button?.focus())
  }, [opener])
  return {
    // Handoff: the form opens from any perspective (Faheem, 21 Oct); PR #47 opens it only with no perspective.
    opensForm: true,
    open: (event) => setOpener(event.currentTarget),
    form: opener ? <CreateVariantForm onClose={close} /> : null,
  }
}

function PanelHeader() {
  const {world} = useInventoryConcepts()
  const createForm = useCreateVariantForm()
  return (
    <Flex
      align="center"
      data-testid="inventory-header"
      gap={2}
      paddingLeft={4}
      paddingRight={3}
      paddingY={3}
    >
      {/* Text 1 semibold, as Studio's pane headers (Andrej, 2026-10-21: "should follow the sizes
          that are common for panels"). */}
      <Box flex={1}>
        <Text size={1} textOverflow="ellipsis" weight="semibold">
          Versions of {worldDocument(world).title}
        </Text>
      </Box>
      {/* Create variant, as the rhombus-add icon left of expand (Andrej, 2026-10-21, a note on his
          screenshot: "add rhombus"). It opens the create variant form with no perspective
          selected; otherwise it is not designed and does nothing. */}
      <Button
        aria-label="Create variant"
        data-testid="inventory-header-create"
        icon={CreateVariantIcon}
        mode="bleed"
        onClick={createForm.opensForm ? createForm.open : noop}
        tooltipProps={{content: 'Create variant'}}
      />
      {createForm.form}
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
 * Whether a variant matches the bar: nothing is missing, so the list's served row is the exact
 * variant's version. A published variant with no draft is a match in Published (Andrej,
 * 2026-10-21), where its published version is in the bar's bundle.
 */
export function matchesBar(answer: ServedAnswer): boolean {
  return answer.missing === undefined
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
      <SearchToggle />
      <FilterToggle />
      {!narrow && <SortMenu />}
      {!narrow && <ViewSettingsMenu />}
      {!narrow && <ToolbarCreateButton />}
    </Flex>
  )
}

/**
 * Where the create button sits (Andrej, 2026-10-21: "keep the informational overlay clear"). `footer`, the default, is a document action bar at the panel's
 * bottom ("We want the create variant button in the actions bar"). `toolbar`, an exploration kept
 * beside it, is the rhombus-add icon at the toolbar's right end ("The create button can maybe be an
 * rhombus-add icon").
 */
export type CreateButtonPlacement = 'toolbar' | 'footer'
export const CreateButtonPlacementContext = createContext<CreateButtonPlacement>('footer')

/**
 * The toolbar's create button, at its right end: the rhombus-add icon alone ("The create button can
 * maybe be an rhombus-add icon"). Its name follows the bar: "Add missing variant" adds the
 * bar's missing version; "Create variant" is not designed and does nothing.
 */
function ToolbarCreateButton() {
  const placement = useContext(CreateButtonPlacementContext)
  const {world, answer, addMissingVersion} = useInventoryConcepts()
  const createForm = useCreateVariantForm()
  if (placement !== 'toolbar' || !variantsOn(world)) return null
  const addsVersion = answer.missing?.kind === 'version'
  return (
    <>
      <Button
        aria-label={answer.action}
        data-testid="inventory-create-action"
        icon={CreateVariantIcon}
        mode="bleed"
        onClick={addsVersion ? addMissingVersion : createForm.opensForm ? createForm.open : noop}
        tooltipProps={{content: answer.action}}
      />
      {createForm.form}
    </>
  )
}

/**
 * The panel's footer, a document action bar as Studio's Document form has one (DocumentStatusBar):
 * 4 px around a card with 8 px padding, its one action on the right as Publish is, no top border,
 * so its button sits on Manage versions' line. This is Card in By priority's footer, now with the
 * create button's label rule: "Add missing variant" adds the bar's missing version; "Create
 * variant" is not designed and does nothing.
 */
function PanelFooter() {
  const placement = useContext(CreateButtonPlacementContext)
  const {world, answer, addMissingVersion} = useInventoryConcepts()
  const createForm = useCreateVariantForm()
  // With variants off there is nothing to create here, and the footer goes.
  // Handoff: the footer button is always there (PR #47 hides it when the bar matches no version and leaves the action to the Document form's banner,
  // which is not part of the open beta).
  if (placement !== 'footer' || !variantsOn(world)) return null
  const addsVersion = answer.missing?.kind === 'version'
  const opensForm = !addsVersion && createForm.opensForm
  return (
    <Box data-testid="inventory-footer" padding={1}>
      <Card padding={2}>
        <Flex justify="flex-end" paddingX={1}>
          <Button
            data-testid="inventory-footer-action"
            icon={CreateVariantIcon}
            mode="ghost"
            onClick={addsVersion ? addMissingVersion : opensForm ? createForm.open : noop}
            text={answer.action}
            tooltipProps={addsVersion || opensForm ? null : NOT_DESIGNED}
          />
        </Flex>
      </Card>
      {createForm.form}
    </Box>
  )
}

/** The toolbar's search button opens the search field under the toolbar, and closes it again. */
function SearchToggle() {
  const {search, setSearch} = useInventoryConcepts()
  const open = search !== undefined
  return (
    <Button
      aria-label="Search"
      aria-pressed={open}
      data-testid="inventory-search-toggle"
      icon={SearchIcon}
      mode="bleed"
      onClick={() => setSearch(open ? undefined : '')}
      selected={open}
      tooltipProps={{content: 'Search'}}
    />
  )
}

/**
 * Free-text search over the versions (Andrej, 2026-10-20: "implement the search functionality that
 * allows free text filtering"): Studio's Document list pane field ("Search list"), under the
 * toolbar. It narrows every view as the editor types, across the title, the variant's name, the
 * bundle and the fields changed, together with the filters. Escape, or clearing it, closes it.
 */
function SearchField() {
  const {search, setSearch} = useInventoryConcepts()
  if (search === undefined) return null
  return (
    <Box data-testid="inventory-search" paddingBottom={2} paddingX={3}>
      <TextInput
        aria-label="Search list"
        autoComplete="off"
        autoFocus
        border={false}
        clearButton={search.length > 0}
        fontSize={1}
        icon={SearchIcon}
        onChange={(event) => setSearch(event.currentTarget.value)}
        onClear={() => setSearch(undefined)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setSearch(undefined)
        }}
        padding={2}
        placeholder="Search list"
        radius={2}
        spellCheck={false}
        value={search}
      />
    </Box>
  )
}

/**
 * The toolbar's filter button turns the filter bar on and off and opens no menu (Andrej, 2026-10-20:
 * "The filter button should just turn on and off … the filter bar … we don't want that menu"). It
 * reads selected while the bar shows or a filter is set, so hidden filters stay visible as a state
 * ("Hiding keeps the filters, but the button should be visibly in active state").
 */
function FilterToggle() {
  const {filters, filterBarOpen, toggleFilterBar} = useInventoryConcepts()
  return (
    <Button
      aria-label="Filter"
      aria-pressed={filterBarOpen}
      data-testid="inventory-filter-toggle"
      icon={FilterIcon}
      mode="bleed"
      onClick={toggleFilterBar}
      selected={filterBarOpen || filters.length > 0}
      tooltipProps={{content: 'Filter'}}
    />
  )
}

/**
 * The filter bar sits under the toolbar while the filter button has it on; the toolbar never gives
 * way to it (Andrej, 2026-10-19: "we never kind of like remove the
 * view selector and override it, we just show the filter bar under it … people would be choosing
 * the save view from the view selector menu"). Save view lives in the views menu, so the bar holds
 * the filters, Add filter and Clear filters, and needs no Done. Clear filters removes the filters and
 * leaves the bar open. A theme border divides the bar from the list, as under a pane toolbar
 * (Andrej, 2026-10-20: "there needs to be a divider towards the list of the versions below"). In the
 * 240 px pane Clear filters takes its own line after Add filter, so a chip keeps the width its ✕
 * needs.
 */
function FilterBar({narrow}: {narrow: boolean}) {
  const {filters, removeFilter, resetFilters, world} = useInventoryConcepts()
  const clear = <Button mode="bleed" onClick={resetFilters} text="Clear filters" />
  // Clear filters shows only while there is a filter to clear; Add filter always shows.
  const hasFilters = filters.length > 0
  return (
    <ModeBar borderBottom testId="inventory-filter-bar">
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
          <AddFilterMenu />
          {narrow && hasFilters && (
            <Box data-testid="inventory-filter-actions" style={{flexBasis: '100%'}}>
              {clear}
            </Box>
          )}
        </Flex>
        {!narrow && hasFilters && (
          <Flex data-testid="inventory-filter-actions" gap={1} style={{flex: 'none'}}>
            {clear}
          </Flex>
        )}
      </Flex>
    </ModeBar>
  )
}

/**
 * Delete asks first, in Studio's small dialog, as Discard version does. When the selection holds the
 * version this visitor is served, the dialog says what the visitor gets instead (Andrej, 2026-10-20:
 * "that information of the fallback needs to go into the delete dialog"). The prototype deletes
 * nothing: Delete closes the dialog and clears the selection.
 */
function DeleteVersionsDialog({onClose}: {onClose: () => void}) {
  const {world, visitor, release, selectedKeys, clearSelection} = useInventoryConcepts()
  const count = selectedKeys.size
  const fallback = deleteFallbackText(world, visitor, release, selectedKeys)
  const confirm = () => {
    clearSelection()
    onClose()
  }
  return (
    <Dialog
      footer={{confirmButton: {onClick: confirm, text: 'Delete', tone: 'critical'}}}
      header={count === 1 ? 'Delete version?' : `Delete ${count} versions?`}
      id="inventory-delete-versions-dialog"
      onClose={onClose}
      width={0}
    >
      <Stack gap={4}>
        <Text size={1}>
          {count === 1
            ? 'This deletes the selected version from this document.'
            : `This deletes the ${count} selected versions from this document.`}
        </Text>
        {fallback && (
          <Text data-testid="inventory-delete-fallback" size={1}>
            {fallback}
          </Text>
        )}
      </Stack>
    </Dialog>
  )
}

/**
 * The bulk bar takes the toolbar's place while rows are selected, at the toolbar's height, so the
 * list does not move. At 240 px the actions do not fit on that one line: the pane's bulk bar keeps
 * the count, folds Delete into ⋯ and deselects with ✕, and has no Compare. Delete opens the delete
 * dialog in both.
 */
function BulkBar({narrow}: {narrow: boolean}) {
  const {selectedKeys, clearSelection} = useInventoryConcepts()
  const [deleting, setDeleting] = useState(false)
  const dialog = deleting && <DeleteVersionsDialog onClose={() => setDeleting(false)} />
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
              <MenuItem onClick={() => setDeleting(true)} text="Delete" tone="critical" />
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
        {dialog}
      </ModeBar>
    )
  }
  return (
    <ModeBar testId="inventory-bulk-bar">
      {count}
      {/* Handoff: Compare is not designed yet, so it is not offered (PR #47 draws it with a "Not designed yet" tooltip). */}
      <Button mode="bleed" onClick={() => setDeleting(true)} text="Delete" tone="critical" />
      <Box flex={1} />
      <Button mode="bleed" onClick={clearSelection} text="Deselect all" />
      {dialog}
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
      // The header sticks to the top of the list while its rows scroll, in every view (Andrej,
      // 2026-10-20: "They could be made sticky though when scrolled … They should then stick to
      // the top of the inventory"). The list scrolls in its own box under the toolbar and the
      // filter bar, so its top edge is already below them: offset 0 in that box.
      // It sits above the rows' checkbox and status icons, which take z-index 1.
      style={{
        background: 'var(--card-code-bg-color)',
        cursor: 'pointer',
        minHeight: 32,
        position: 'sticky',
        top: 0,
        zIndex: 2,
      }}
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

/**
 * By stage's subtitle: when the version was last edited, as Studio's Document status says it
 * ("Edited 2 days ago"), then the fields changed. Counted from the fixture's now.
 */
function EditedSubtitle({editedAt, detail}: {editedAt: string; detail: string}) {
  const edited = useRelativeTime(editedAt, {
    minimal: true,
    useTemporalPhrase: true,
    relativeTo: new Date(FIXTURE_NOW),
  })
  return <>{[`Edited ${edited}`, detail].filter(Boolean).join(' · ')}</>
}

function Row({row}: {row: InventoryRow}) {
  const {selectEntry, toggleSelected, answer, world, release} = useInventoryConcepts()
  // The row a visitor gets carries a label; the row keeps the list's highlights (Andrej,
  // 2026-10-21: "Can only the served label be green").
  const served = row.isShown && variantsOn(world)
  const label = served
    ? servedLabel(
        answer,
        world.releases.find((doc) => doc.name === release),
      )
    : undefined
  const highlighted = row.isHere || row.isSelected
  const status = <RowStatus entry={row.entry} />
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
            {row.editedAt ? (
              <EditedSubtitle detail={row.subtitle} editedAt={row.editedAt} />
            ) : (
              row.subtitle
            )}
          </Text>
        </Stack>
      </div>
      {/* The status icons, as the Document list pane draws them. */}
      <Flex align="center" className="inert" gap={2}>
        {/* The served row says so (Andrej, 2026-10-21: "The row that is being served can get a
            label that says (served for this perspective) or something shorter"), as Studio's
            Variants tool labels a row's bundle: a radius-2 Badge. */}
        {/* The version the Document form shows (Andrej, 2026-10-21: "Please add a label that says
            Editing as well"), first, in the primary tone of the list's own highlight on it, as
            Studio's Document list pane marks the document open in the form. No tooltip, as that
            pane has none. */}
        {row.isHere && variantsOn(world) && (
          <Badge data-testid="inventory-editing-label" radius={2} tone="primary">
            Editing
          </Badge>
        )}
        {label && (
          <Tooltip content={label.tooltip} placement="top" portal>
            {/* The label takes the pointer for its tooltip, above the row's full-width button, as
                the status icons do. */}
            <span
              data-testid="inventory-served-label-target"
              style={{display: 'flex', pointerEvents: 'auto', position: 'relative', zIndex: 1}}
            >
              <Badge
                data-served={label.kind}
                data-testid="inventory-served-label"
                radius={2}
                tone={label.tone}
              >
                {label.text}
              </Badge>
            </span>
          </Tooltip>
        )}
        {/* Three icons wide and right-aligned, so the published disc keeps one column. */}
        <Flex data-testid="inventory-status" justify="flex-end" style={{width: 45}}>
          {row.statusLabel ? (
            // The icons take the pointer for their tooltip, above the row's full-width button, as
            // the checkbox does; a click on them still chooses the row.
            <Tooltip content={row.statusLabel} placement="top" portal>
              <span
                data-testid="inventory-status-tooltip-target"
                onClick={() => selectEntry(row.entry)}
                style={{display: 'flex', pointerEvents: 'auto', position: 'relative', zIndex: 1}}
              >
                {status}
              </span>
            </Tooltip>
          ) : (
            status
          )}
        </Flex>
      </Flex>
    </VariantSetEntry>
  )
  // One highlight only, the primary tone, on the version the form edits or a selected one (Andrej,
  // 2026-10-20: "It should always be only one standard highlight"). The served version keeps
  // `data-shown`.
  if (highlighted) return <Highlight tone="primary">{entry}</Highlight>
  // The row a visitor gets instead takes the banner's tone too, so the banner, the label and the
  // row read as one state (Andrej, 2026-10-21: "make the row that says Served instead in the
  // caution tone. This way we have visual connection between the yellow elements"). A theme card,
  // so hover and focus draw on it as on any row; a selected row keeps the primary highlight.
  if (label?.kind === 'instead') {
    return (
      <Highlight data-testid="inventory-served-instead-row" tone={label.tone}>
        {entry}
      </Highlight>
    )
  }
  return entry
}

/**
 * The served row's label. With a match it reads "Served", green, in Andrej's tooltip words
 * (2026-10-21). With something missing it reads "Served instead" (Andrej, 2026-10-21: "We can also
 * scroll to a labeled version in the inventory"), in the tone of the banner the Document form shows
 * for what is missing: no base in the bar's release is Studio's DocumentNotInReleaseBanner, in the
 * release's own tone (`getReleaseTone`); a missing variant version is its
 * DocumentNotInVariantBanner, suggest; a variant with no definition is its
 * VariantDefinitionNotFoundBanner, caution. The second tooltip is a draft for Andrej.
 */
function servedLabel(
  answer: ServedAnswer,
  release: TargetPerspective | undefined,
): {kind: 'match' | 'instead'; text: string; tone: BadgeTone; tooltip: string} {
  if (matchesBar(answer)) {
    return {
      kind: 'match',
      text: 'Served',
      tone: 'positive',
      tooltip:
        'A visitor matching this perspective gets served this variant with highest priority.',
    }
  }
  const missing = answer.missing
  const tone =
    missing?.kind === 'version' && !missing.variantId && release
      ? getReleaseTone(release)
      : missing?.kind === 'version'
        ? 'suggest'
        : 'caution'
  return {
    kind: 'instead',
    text: 'Served instead',
    tone,
    tooltip:
      'No variant matches this perspective. A visitor matching it gets this variant instead.',
  }
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
 * When the filters leave no row, in every view: one muted line in place of the groups, as Studio's
 * other empty lists have (Andrej, 2026-10-20: "when there is no matching, we just show them an empty
 * state in the list"). The filter bar above keeps the chips, Add filter and Clear filters, the one
 * action that clears them ("Only the clear filter action clears them").
 */
function NoMatches() {
  return (
    <Box aria-live="polite" data-testid="inventory-no-matches" paddingX={4} paddingY={5}>
      <Text align="center" muted size={1}>
        No versions match these filters.
      </Text>
    </Box>
  )
}

/** How long after the editor's own wheel, touch, key or pointer input the list does not scroll. */
const USER_SCROLL_QUIET_MS = 1000

/**
 * When the editor last scrolled the list. Kept outside the panel: a perspective change remounts the
 * Document inspector, and with it the panel, so a ref would forget the input.
 */
let lastUserInput = 0

/**
 * The list scrolls so the row of the version the Document form shows is in view: when the panel
 * opens and when the bar's perspective changes, centred, only when the row is not in view, as
 * Studio's comments scroll to a comment, but as a jump. It never scrolls while the editor is
 * scrolling the list.
 */
function useScrollToFormRow(list: HTMLElement | null): void {
  const {answer, release, visitor, world, view, currentEntryKey} = useInventoryConcepts()
  useEffect(() => {
    if (!list) return undefined
    const mark = () => {
      lastUserInput = Date.now()
    }
    const events = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const
    for (const name of events) list.addEventListener(name, mark, {passive: true})
    return () => {
      for (const name of events) list.removeEventListener(name, mark)
    }
  }, [list])
  // The row of the version the Document form shows, in every view (Andrej, 2026-10-21: "What I want
  // to be visible in the inventory … is the currently viewed variant in the form"). When the form
  // shows no version, read only, with the bar's version missing, the "Served instead" row. The
  // view the panel opens in follows the bar's release, so the scroll runs again when it changes.
  const servedKey = currentEntryKey ?? (variantsOn(world) ? answer.served?.key : undefined)
  const perspective = `${release}|${JSON.stringify(visitor)}|${view}`
  useEffect(() => {
    if (!list || !servedKey) return undefined
    const frame = requestAnimationFrame(() => {
      if (Date.now() - lastUserInput < USER_SCROLL_QUIET_MS) return
      const row = list.querySelector<HTMLElement>(`[data-testid="inventory-row-${servedKey}"]`)
      if (!row) return
      const box = list.getBoundingClientRect()
      const at = row.getBoundingClientRect()
      // Screen pixels per CSS pixel: the concept frame scales the Studio to fit narrow windows,
      // and the rects are in screen pixels while `scrollTop` is in CSS pixels.
      const scale = box.height / list.offsetHeight || 1
      // The sticky group header covers the list's top edge.
      const header =
        (list.querySelector<HTMLElement>('.inventory-group')?.offsetHeight ?? 0) * scale
      if (at.top >= box.top + header && at.bottom <= box.bottom) return
      const offset = (at.top - box.top) / scale
      const top = list.scrollTop + offset - (list.clientHeight - at.height / scale) / 2
      // A jump, not an animation ("please scroll there without an animation").
      list.scrollTo({top: Math.max(0, top), behavior: 'instant'})
    })
    return () => cancelAnimationFrame(frame)
  }, [list, servedKey, perspective])
}

/**
 * `wide` is the 480 px panel of concepts A and B, with its own header. `narrow` is concept C's
 * 240 px pane, whose title, ＋ and ⋯ live in Studio's pane header instead.
 */
export function VersionInventoryPanel({layout = 'wide'}: {layout?: 'wide' | 'narrow'}) {
  const {groups, filters, filterBarOpen, search, selectedKeys} = useInventoryConcepts()
  const narrow = layout === 'narrow'
  const [filterSlot, setFilterSlot] = useState<HTMLElement | null>(null)
  const [list, setList] = useState<HTMLElement | null>(null)
  useScrollToFormRow(narrow ? null : list)
  const {applyDefaultView} = useInventoryConcepts()
  useEffect(() => applyDefaultView(), [applyDefaultView])
  // Groups whose header was clicked, by id: every group starts open, and a click collapses it. A
  // view's groups keep their state when the editor comes back to it.
  const [toggled, setToggled] = useState<ReadonlySet<string>>(new Set())
  const isCollapsed = (group: InventoryGroup) => toggled.has(group.id)
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
        {selectedKeys.size > 0 ? <BulkBar narrow={narrow} /> : <Toolbar narrow={narrow} />}
      </Box>
      <SearchField />
      {filterBarOpen && <FilterBar narrow={narrow} />}
      <PublishDatePicker anchor={filterSlot} />
      {/* The list does not bounce at either end (Andrej, 2026-10-20: "I also do not want
          bouncing"): a rubber-band overscroll moves the stuck headers with the rows and opens a
          gap above them. It also keeps the scroll from passing on to the pane behind. */}
      <Box
        data-testid="inventory-list"
        flex={1}
        ref={setList}
        overflow="auto"
        style={{overscrollBehavior: 'none'}}
      >
        <RowShell
          data-narrow={narrow || undefined}
          data-selecting={selectedKeys.size > 0 || undefined}
        >
          {(filters.length > 0 || (search ?? '').trim().length > 0) && noRows ? (
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
