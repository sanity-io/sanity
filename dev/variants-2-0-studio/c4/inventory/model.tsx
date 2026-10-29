import {type ReleaseDocument} from '@sanity/client'
import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {Progress50Icon} from '@sanity/icons/Progress50'
import {
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useRouter} from 'sanity/router'

// Ported from Andrej's version inventory side panel in the Storybook Variants 2.0 branch (sanity-labs/sanity-studio-storybook,
// explorations/inventory-sidepanel (PR #47), commit 10f3f729a9, lib/explorations/variants/inventory-concepts/model.tsx).
// Changes: imports point at this monorepo and ./fixtures (a LIVE replacement of his fixtures); LIVE: marks other changes.
import {PerspectiveProvider} from '../../../../packages/sanity/src/core/perspective/PerspectiveProvider'
import {type ReleaseId} from '../../../../packages/sanity/src/core/perspective/types'
import {useSetPerspective} from '../../../../packages/sanity/src/core/perspective/useSetPerspective'
import {sortReleases} from '../../../../packages/sanity/src/core/releases/hooks/utils'
import {formatRelativeLocale} from '../../../../packages/sanity/src/core/util/formatRelativeLocale'
import {VARIANT_DOCUMENTS_PATH} from '../../../../packages/sanity/src/core/variants/store/constants'
import {type SystemVariant} from '../../../../packages/sanity/src/core/variants/types'
import {baseNames} from '../../c15/baseName'
import {
  baseWorld,
  defaultVisitor,
  FIXTURE_NOW,
  type DimensionName,
  type InventoryEntry,
  type InventoryGroupId,
  worldDimensions,
  worldDocument,
  worldVariants,
  type InventoryWorld,
  ME,
  PEOPLE,
  variantsOn,
  type Visitor,
  type WorkflowStage,
} from './fixtures'

/**
 * The state every inventory concept shares, and the rules that turn it into rows.
 *
 * The perspective bar is the one source of the perspective: the release (the router's
 * `perspective` sticky param, which the real release menu writes) and one value per dimension
 * (absent reads "All"). Everything else follows from it:
 * - the EXACT variant is the definition whose conditions are exactly the chosen dimensions; with
 *   none chosen it is the base document;
 * - the CURRENT row is that variant's version in the chosen release, and it is highlighted. When
 *   the release holds no such version, nothing is highlighted and the form says so;
 * - Studio's own `PerspectiveProvider` receives the release and the exact variant, so the real
 *   form switches to the same version the inventory highlights.
 *
 * Choosing a row sets the bar: its release, and its variant's conditions as the dimension values.
 */

/** The list's base views: the toolbar's view button names the current one. */
/**
 * By publish date is the default: releases group the rows, in the order they go live (Andrej,
 * 2026-10-14: "The view is by publishing date. The releases are grouping within that view.").
 */
export type InventoryView = 'publishDate' | 'stage'

export const VIEW_LABELS: Record<InventoryView, string> = {
  stage: 'By stage',
  publishDate: 'By publish date',
}

export type GroupBy = 'release' | DimensionName | 'none'

export type SortBy = 'lastEdited' | 'name' | 'publishDate'
export type SortOrder = 'desc' | 'asc'
/** `undefined` keeps the stored order, which is the board's order. */
export type Sort = {by: SortBy; order: SortOrder} | undefined

/**
 * A filter narrows the list by a dimension value, or, in By publish date, by when a version goes out
 * (Andrej, 2026-10-15: "show options for today, tomorrow, this week, etc. and a specific date").
 */
export type Filter =
  | {kind: 'dimension'; dimension: DimensionName; value: string}
  | {kind: DateKind; range: 'relative'; which: RelativeWhich; unit: RelativeUnit}
  | {kind: DateKind; range: 'rolling'; days: 7 | 14}
  | {kind: DateKind; range: 'span'; from: string; to: string}
  | {kind: 'stage'; stage: WorkflowStage | 'published'}
  | {kind: 'assignee'; person: string}
  | {kind: 'editedBy'; person: string}
  | {kind: 'bundle'; bundle: string}

/** Every scheduled draft is one bundle option, "Scheduled drafts". */
export const SCHEDULED_DRAFTS = 'scheduledDrafts'

/** The Release filter's options: drafts, each named release, the scheduled drafts, published. */
export function bundleOptions(world: InventoryWorld): [string, string][] {
  const named = world.releases
    .filter((r) => r.metadata.cardinality !== 'one')
    .map((r): [string, string] => [r.metadata.title ?? r.name, r.name])
  const hasScheduledDrafts = world.releases.some((r) => r.metadata.cardinality === 'one')
  return [
    ['Drafts', 'drafts'],
    ...named,
    ...(hasScheduledDrafts ? [['Scheduled drafts', SCHEDULED_DRAFTS] as [string, string]] : []),
    ['Published', 'published'],
  ]
}

/**
 * By stage filters for collaboration (Andrej, 2026-10-15: "For the stage we may want to include
 * edited by ... a certain person. This will help hone on collaboration. There could be something
 * like assigned to me"): the stage, who it is assigned to, who edited it, and when.
 */
export const STAGE_FILTER_LABELS: Record<WorkflowStage | 'published', string> = {
  draft: 'Draft',
  inReview: 'In review',
  approved: 'Approved',
  published: 'Published',
}

/** Assignee for a draft no one is assigned to; Studio's Tasks call it "Unassigned". */
export const UNASSIGNED = 'unassigned'

/** A person's name as the filters show it: the signed-in user is "Me". */
export const personLabel = (id: string) =>
  id === ME
    ? 'Me'
    : id === UNASSIGNED
      ? 'Unassigned'
      : (PEOPLE.find((p) => p.id === id)?.name ?? id)

/**
 * The two date filters share one pattern: shortcuts in the menu, Specific date on the calendar
 * (Andrej, 2026-10-15: "Last edited should be reflecting this is the same type of time filter like
 * what we have in the by publishing date"). A publish date looks ahead, a last edit looks back.
 */
export type DateKind = 'publishDate' | 'lastEdited'

/**
 * A date relative to today, as the calendar's two selects pick it (Andrej, 2026-10-15: "Can we add
 * this sort of control to the calendar … We may not need the past option as this is about
 * publishing documents"): This or Next for a publish date, This or Last for a last edit, then a day,
 * week, month, quarter or year, each a whole period. The menu's shortcuts are the same filters.
 */
export type RelativeWhich = 'this' | 'next' | 'last'
export type RelativeUnit = 'day' | 'week' | 'month' | 'quarter' | 'year'

/** The selects' first options, per date kind: forward for publishing, back for editing. */
export const RELATIVE_WHICH_LABELS: Record<DateKind, Partial<Record<RelativeWhich, string>>> = {
  publishDate: {this: 'This', next: 'Next'},
  lastEdited: {this: 'This', last: 'Last'},
}
export const RELATIVE_UNIT_LABELS: Record<RelativeUnit, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
  quarter: 'quarter',
  year: 'year',
}

export type DateFilter = Extract<Filter, {kind: DateKind}>

/** The menu's shortcuts, in order; 7 and 14 days roll from today, ahead or back. */
export function dateShortcuts(kind: DateKind): [string, DateFilter][] {
  const ahead = kind === 'publishDate'
  return [
    ['Today', {kind, range: 'relative', which: 'this', unit: 'day'}],
    ahead
      ? ['Tomorrow', {kind, range: 'relative', which: 'next', unit: 'day'}]
      : ['Yesterday', {kind, range: 'relative', which: 'last', unit: 'day'}],
    [ahead ? '7 days' : 'Last 7 days', {kind, range: 'rolling', days: 7}],
    [ahead ? '14 days' : 'Last 14 days', {kind, range: 'rolling', days: 14}],
    ['This month', {kind, range: 'relative', which: 'this', unit: 'month'}],
    ['This quarter', {kind, range: 'relative', which: 'this', unit: 'quarter'}],
    ['This year', {kind, range: 'relative', which: 'this', unit: 'year'}],
  ]
}

/** Whether two filters are the same choice. */
export const sameFilter = (a: Filter | undefined, b: Filter) =>
  a !== undefined && JSON.stringify(a) === JSON.stringify(b)

const DAY_ONLY = new Intl.DateTimeFormat('en-US', {dateStyle: 'medium'})

/** The fixture's today as `yyyy-mm-dd`. */
export const FIXTURE_NOW_DAY = (() => {
  const now = new Date(FIXTURE_NOW)
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
})()

/** A local day as `yyyy-mm-dd`, the shape a span filter stores. */
export function dayKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * The first and last day a date filter covers, as `yyyy-mm-dd`, counted from the fixture's
 * now. A relative filter covers its whole period; 7 days and 14 days roll from today (Andrej,
 * 2026-10-15: "Call this week and next week 7 days, 14 days"). The calendar tints these days, and
 * the filter keeps the rows going out on them.
 */
export function dateBounds(filter: DateFilter): [string, string] {
  if (filter.range === 'span') return [filter.from, filter.to]
  const now = new Date(FIXTURE_NOW)
  const [y, m, d] = [now.getFullYear(), now.getMonth(), now.getDate()]
  // Calendar days, not 24-hour steps: a day that changes the clock is 23 or 25 hours long.
  const at = (year: number, month: number, date: number) => dayKey(new Date(year, month, date))
  if (filter.range === 'rolling') {
    return filter.kind === 'publishDate'
      ? [at(y, m, d), at(y, m, d + filter.days - 1)]
      : [at(y, m, d - filter.days + 1), at(y, m, d)]
  }
  const next = filter.which === 'next' ? 1 : filter.which === 'last' ? -1 : 0
  switch (filter.unit) {
    case 'day':
      return [at(y, m, d + next), at(y, m, d + next)]
    case 'week': {
      // Sunday to Saturday, as Studio's calendar lays weeks out.
      const sunday = d - now.getDay() + next * 7
      return [at(y, m, sunday), at(y, m, sunday + 6)]
    }
    case 'month':
      return [at(y, m + next, 1), at(y, m + next + 1, 0)]
    case 'quarter': {
      const first = Math.floor(m / 3) * 3 + next * 3
      return [at(y, first, 1), at(y, first + 3, 0)]
    }
    case 'year':
      return [at(y + next, 0, 1), at(y + next, 11, 31)]
  }
}

/** The filter bar's chip: "Language is Norwegian", "Publish date is tomorrow". */
export function filterLabel(filter: Filter, world: InventoryWorld): string {
  if (filter.kind === 'dimension') {
    const dimension = worldDimensions(world).find((d) => d.name === filter.dimension)!
    const value = dimension.values.find((v) => v.value === filter.value)?.title
    return `${dimension.title} is ${value}`
  }
  if (filter.kind === 'stage') return `Stage is ${STAGE_FILTER_LABELS[filter.stage]}`
  if (filter.kind === 'assignee')
    return `Assigned to ${personLabel(filter.person).replace(/^Me$/, 'me')}`
  if (filter.kind === 'editedBy')
    return `Edited by ${personLabel(filter.person).replace(/^Me$/, 'me')}`
  if (filter.kind === 'bundle') {
    const title = bundleOptions(world).find(([, id]) => id === filter.bundle)?.[0] ?? filter.bundle
    return `Release is ${title}`
  }
  const lead = filter.kind === 'publishDate' ? 'Publish date is' : 'Last edited'
  // A count of days reads as a window in a sentence: "Publish date is within 7 days", "Last edited
  // in the last 7 days".
  if (filter.range === 'rolling') {
    return filter.kind === 'publishDate'
      ? `${lead} within ${filter.days} days`
      : `${lead} in the last ${filter.days} days`
  }
  return `${lead} ${dateValueLabel(filter).replace(/^(Today|Tomorrow|Yesterday|This|Next|Last)\b/, (w) => w.toLowerCase())}`
}

/**
 * A date filter's value alone, as a submenu's trigger and a chip end show it: "Tomorrow", "Next
 * week", "Oct 13 – 15, 2026". The year once when both ends share it, both years when the span
 * crosses one (Andrej, 2026-10-15: "keep in mind that there will be cases when dates cross two
 * years").
 */
export function dateValueLabel(filter: DateFilter): string {
  if (filter.range === 'span') {
    return DAY_ONLY.formatRange(
      new Date(`${filter.from}T00:00:00`),
      new Date(`${filter.to}T00:00:00`),
    )
  }
  const shortcut = dateShortcuts(filter.kind).find(([, f]) => sameFilter(f, filter))?.[0]
  if (shortcut) return shortcut
  if (filter.range === 'rolling') return `${filter.days} days`
  const which = filter.which === 'this' ? 'This' : filter.which === 'next' ? 'Next' : 'Last'
  return `${which} ${filter.unit}`
}

/** Which view's filter menu offers a filter: dimensions are offered in every view. */
function filterOffered(filter: Filter, view: InventoryView): boolean {
  if (filter.kind === 'dimension') return true
  if (filter.kind === 'publishDate') return view === 'publishDate'
  if (filter.kind === 'lastEdited') return view === 'stage'
  // The Release filter is offered in no view's menu; a saved view can still hold it.
  if (filter.kind === 'bundle') return false
  return view === 'stage'
}

/** One filter per dimension, and one publish-date filter. */
export const filterKey = (filter: Filter) =>
  filter.kind === 'dimension' ? filter.dimension : filter.kind

/** Every view opens on Publish date, Ascending, unless the editor picks another sort. */
const DEFAULT_SORT: Sort = {by: 'publishDate', order: 'asc'}
/**
 * By stage lists the rows by last edit, the newest first, until the editor picks a sort (Andrej,
 * 2026-10-20: "The drafts should be ordered by last edited date").
 */
const STAGE_SORT: Sort = {by: 'lastEdited', order: 'desc'}

/**
 * A view an editor kept: a name for one of the views, with its filters and sort (Andrej,
 * 2026-10-19: "We want to prototype how saving and removing views from saved views works").
 * Choosing it restores all three.
 */
export interface SavedView {
  id: string
  name: string
  view: InventoryView
  filters: Filter[]
  sort: Sort
}

/** The saved views every story opens with; an editor saves more, and deletes them, per session. */
const NO_SAVED_VIEWS: SavedView[] = []

// His sample saved views, kept for reference (unused live).
export const SEED_SAVED_VIEWS: SavedView[] = [
  {
    id: 'norwegian',
    name: 'Norwegian',
    view: 'publishDate',
    filters: [{kind: 'dimension', dimension: 'language', value: 'nb'}],
    sort: DEFAULT_SORT,
  },
  {
    id: 'changed-this-week',
    name: 'Changed this week',
    view: 'publishDate',
    filters: [{kind: 'lastEdited', range: 'rolling', days: 7}],
    sort: DEFAULT_SORT,
  },
  {
    id: 'ready-for-spring-launch',
    name: 'Ready for Spring launch',
    view: 'publishDate',
    filters: [{kind: 'bundle', bundle: 'rSpringLaunch'}],
    sort: DEFAULT_SORT,
  },
]

export const GROUP_ORDER: InventoryGroupId[] = [
  'drafts',
  'rSpringLaunch',
  'rSummerSale',
  'rAutumnCampaign',
  'rScheduledReturning',
  'rScheduledDraft',
  'published',
]

/**
 * Workflow stages, in order, as By stage groups them. Draft takes the drafts dot, as Published (the
 * last group) takes the published one: the same states. The stages between take Studio's task
 * status family, an empty circle to a check: half-filled for In review, Done's check for Approved.
 */
const STAGES: [WorkflowStage, string, Pick<InventoryGroup, 'icon' | 'glyph'>][] = [
  ['draft', 'Draft', {icon: 'drafts'}],
  ['inReview', 'In review', {glyph: Progress50Icon}],
  ['approved', 'Approved', {glyph: CheckmarkCircleIcon}],
]

export type Match = {kind: 'conditions'; count: number} | {kind: 'default'} | {kind: 'none'}

export interface InventoryRow {
  entry: InventoryEntry
  variant: SystemVariant | undefined
  title: string
  subtitle: string
  match: Match
  isBase: boolean
  isHere: boolean
  /** The version visitors get with the bar's perspective; the row marks it with an icon. */
  isShown: boolean
  isSelected: boolean
  /** By stage: when the version was last edited, which the row's subtitle leads with. */
  editedAt?: string
  /** By stage: the status icons' tooltip, the variant and where the version sits. */
  statusLabel?: string
}

export interface InventoryGroup {
  id: string
  /** `undefined` for the one header-less group of an ungrouped list. */
  title: string | undefined
  /** Grey text after the title, joined by `secondaryJoin`. */
  secondary?: string
  /** What joins title and secondary; two spaces unless set. */
  secondaryJoin?: string
  /** The release (or `drafts` / `published`) whose icon the header shows. */
  icon?: ReleaseDocument | 'drafts' | 'published'
  /** A plain icon instead, for a group that is no release: a workflow stage. */
  glyph?: ComponentType
  rows: InventoryRow[]
  /** The line under the header while the group has no rows; without it an empty group is left out. */
  emptyText?: string
}

/** A world's variants by short id, built once per variants list. */
const variantsByIdCache = new WeakMap<SystemVariant[], Map<string, SystemVariant>>()
function variantsById(world: InventoryWorld): Map<string, SystemVariant> {
  const variants = worldVariants(world)
  let byId = variantsByIdCache.get(variants)
  if (!byId) {
    byId = new Map(variants.map((v) => [v._id.slice(VARIANT_DOCUMENTS_PATH.length + 1), v]))
    variantsByIdCache.set(variants, byId)
  }
  return byId
}

/** A variant matches when every one of its conditions agrees with the visitor. */
export function matchVariant(variant: SystemVariant | undefined, visitor: Visitor): Match {
  if (!variant) return {kind: 'default'}
  const conditions = Object.entries(variant.conditions ?? {})
  const agrees = conditions.every(
    ([dimension, value]) => visitor[dimension as DimensionName] === value,
  )
  return agrees ? {kind: 'conditions', count: conditions.length} : {kind: 'none'}
}

function tier(match: Match): number {
  if (match.kind === 'conditions') return 1000 + match.count
  return match.kind === 'default' ? 100 : 0
}

/**
 * The fields a version changes, without counting them (Andrej, 2026-10-15: "To simplify the view, I
 * want to remove the amount of changes counted in the subheadline").
 */
function changesText(entry: InventoryEntry): string {
  return entry.changedFields.join(', ')
}

function variantFor(world: InventoryWorld, entry: InventoryEntry): SystemVariant | undefined {
  return entry.variantId ? variantsById(world).get(entry.variantId) : undefined
}

function priorityOf(world: InventoryWorld, entry: InventoryEntry): number {
  return variantFor(world, entry)?.priority ?? 0
}

function titleOf(world: InventoryWorld, entry: InventoryEntry): string {
  return variantFor(world, entry)?.metadata?.title ?? baseNames().inventory
}

/** Hours since the edit, from the row's relative time ("1h ago", "2d ago", "2w ago", "1mo ago"). */
function ageInHours(entry: InventoryEntry): number {
  const m = /^(\d+)(h|d|w|mo) ago$/.exec(entry.updated)
  if (!m) return Number.POSITIVE_INFINITY
  const unit = {h: 1, d: 24, w: 24 * 7, mo: 24 * 30}[m[2] as 'h' | 'd' | 'w' | 'mo']
  return Number(m[1]) * unit
}

/**
 * Studio's publish-date format, the one its perspective menu, version chips, version menu, scheduled
 * banner and compare header share (`formatRelativeLocale`): "tomorrow at 9:00 AM", a weekday within a
 * week, the browser's date beyond (Andrej, 2026-10-15: "follow the date format that is most common in
 * Studio"). Counted from the fixture's now, so the story reads the same any day.
 */
function publishDateLabel(iso: string): string {
  return formatRelativeLocale(iso, FIXTURE_NOW)
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * A row's date is absolute, to the minute (Andrej, 2026-10-15: "keep the absolute date format for the
 * individual rows. We want to be clear on the hour and minute as well. In the header we can be
 * relative"): Studio's most used absolute format, `useDateTimeFormat({dateStyle: 'medium', timeStyle:
 * 'short'})`, which reads "Oct 15, 2026, 10:00 AM" as the Releases tool's compact time does.
 */
const ABSOLUTE = new Intl.DateTimeFormat('en-US', {dateStyle: 'medium', timeStyle: 'short'})

const releaseOf = (world: InventoryWorld, id: InventoryGroupId) =>
  world.releases.find((doc) => doc.name === id)

function releaseDateLabel(world: InventoryWorld, id: InventoryGroupId): string | undefined {
  const release = releaseOf(world, id)
  if (!release) return undefined
  if (release.metadata.releaseType === 'asap') return 'As soon as possible'
  const at = release.metadata.intendedPublishAt
  return at ? publishDateLabel(at) : undefined
}

/**
 * When a row goes out, at the head of its subtitle in By publish date, so the date reads in every
 * grouping, None included (Andrej, 2026-10-15: "When we group by none, currently there is no way
 * to see the actual date of publishing"): "Published Oct 12, 2026", "Scheduled for Oct 15, 2026,
 * 10:00 AM", "As soon as possible" or "Undecided"; a draft says when it was last edited (see editedAgo).
 */
/**
 * PROPOSED (open beta, Faheem 23 Oct): a draft has no publish date, so its line says when it was last edited, in the compact words of the
 * document list's versions popover: "Edited just now", "Edited 3 hr ago", "Edited 2 days ago", "Edited 2 wk ago", "Edited 1 mo ago".
 */
function editedAgo(entry: InventoryEntry): string {
  const hours = ageInHours(entry)
  if (!Number.isFinite(hours)) return 'Not scheduled'
  if (hours < 1) return 'Edited just now'
  if (hours < 24) return `Edited ${Math.floor(hours)} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Edited ${days} ${days === 1 ? 'day' : 'days'} ago`
  if (days < 30) return `Edited ${Math.floor(days / 7)} wk ago`
  if (days < 365) return `Edited ${Math.floor(days / 30)} mo ago`
  return `Edited ${Math.floor(days / 365)} yr ago`
}

function publishMoment(world: InventoryWorld, entry: InventoryEntry): string | undefined {
  // PROPOSED (Faheem, 23 Oct): an empty line read as an error; a draft says when it was last edited instead.
  if (entry.group === 'drafts') return editedAgo(entry)
  // Each row repeats its group's date with what it means, so the date stays readable when the
  // header has scrolled away (Andrej, 2026-10-20: "repeat the publishing date. Add
  // published/scheduled on... so it's clear what this date is"). A published version's last edit
  // is its publishing, so its date is the day it went out, as Studio's medium date.
  if (entry.group === 'published') {
    const at = new Date(Date.parse(FIXTURE_NOW) - ageInHours(entry) * 3_600_000)
    return `Published ${DAY_ONLY.format(at)}`
  }
  const release = releaseOf(world, entry.group)
  if (release?.metadata.releaseType === 'asap') return 'As soon as possible'
  const at = release?.metadata.intendedPublishAt
  return at ? `Scheduled for ${ABSOLUTE.format(new Date(at))}` : 'Undecided'
}

/** A scheduled draft is a single-document release; Studio lists those as Scheduled Drafts. */
function timelineName(release: ReleaseDocument): string {
  return release.metadata.cardinality === 'one'
    ? 'Scheduled draft'
    : (release.metadata.title ?? release.name)
}

function releaseTitle(world: InventoryWorld, id: InventoryGroupId): string {
  if (id === 'drafts') return 'Drafts'
  if (id === 'published') return 'Published'
  const release = releaseOf(world, id)
  return release ? timelineName(release) : id
}

function groupIcon(world: InventoryWorld, id: InventoryGroupId): InventoryGroup['icon'] {
  return id === 'drafts' || id === 'published' ? id : releaseOf(world, id)
}

interface TimelineSlot {
  id: string
  title: string
  secondary?: string
  icon: InventoryGroup['icon']
  bundles: string[]
}

/**
 * By publish date is a timeline (Andrej, 2026-10-14: "published marks the moment 0 in the timeline.
 * then come releases … or scheduled drafts"), sorted by publish date and grouped by bundle (Andrej,
 * 2026-10-14: "The grouping should then by the bundles (releases)"): Published, then one group per
 * release or scheduled draft in the order they go out: as soon as possible, then by publish time, then
 * the releases with no date, under Studio's "Undecided". Each group is one bundle, so a row's group
 * says what it goes out with, and two on one day get a group each. Unscheduled drafts are not on it;
 * they live in By stage.
 */
function timelineSlots(world: InventoryWorld): TimelineSlot[] {
  // A header leads with the bundle's moment, then names the release. Neither kind is named: the icon
  // tells a release from a scheduled draft, and a scheduled draft, having no name, is its date alone
  // (Andrej, 2026-10-15: "maybe we can get by without naming the Scheduled Draft and Release at all.
  // That will minimize the amount of text").
  const slot = (moment: string, release: ReleaseDocument): TimelineSlot => ({
    id: release.name,
    title: release.metadata.cardinality === 'one' ? moment : `${moment} · ${timelineName(release)}`,
    icon: release,
    bundles: [release.name],
  })
  const at = (release: ReleaseDocument) => release.metadata.intendedPublishAt
  const asap = world.releases.filter((r) => r.metadata.releaseType === 'asap')
  const scheduled = world.releases
    .filter((r) => r.metadata.releaseType === 'scheduled' && at(r))
    .sort((a, b) => at(a)!.localeCompare(at(b)!))
  const undated = world.releases.filter(
    (r) =>
      r.metadata.releaseType === 'undecided' || (r.metadata.releaseType === 'scheduled' && !at(r)),
  )
  return [
    {id: 'published', title: 'Published', icon: 'published', bundles: ['published']},
    // Open beta (approved by Faheem, 22 Oct): By publish date is the only view, so the drafts are a group, under Published.
    {id: 'drafts', title: 'Drafts', icon: 'drafts', bundles: ['drafts']},
    ...asap.map((r) => slot('As soon as possible', r)),
    ...scheduled.map((r) => slot(capitalise(publishDateLabel(at(r)!)), r)),
    ...undated.map((r) => slot('Undecided', r)),
  ]
}

/** The sort "Publish date": the timeline's order, then the unscheduled drafts. */
function publishDateOrder(world: InventoryWorld): string[] {
  return [...timelineSlots(world).flatMap((slot) => slot.bundles), 'drafts']
}

/** Local midnight of a date, so day comparisons ignore the time. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * A version's workflow stage. A version in a release is a draft until the release publishes, so it
 * sits in Draft (Faheem, 2026-10-20: "this one is part of that release, but it's a draft").
 */
function stageOf(entry: InventoryEntry): WorkflowStage {
  return entry.stage ?? 'draft'
}

/**
 * Whether a row passes a filter. A publish-date filter keeps the rows whose release goes out in the
 * range, counted from the fixture's now; weeks run Sunday to Saturday. Published rows have gone out,
 * and as-soon-as-possible and undecided rows have no date, so a date filter leaves them out.
 */
function filterMatches(
  world: InventoryWorld,
  visitor: Visitor,
  filter: Filter,
  entry: InventoryEntry,
): boolean {
  if (filter.kind === 'dimension') {
    return variantFor(world, entry)?.conditions?.[filter.dimension] === filter.value
  }
  if (filter.kind === 'stage') {
    return filter.stage === 'published'
      ? entry.group === 'published'
      : entry.group !== 'published' && stageOf(entry) === filter.stage
  }
  if (filter.kind === 'bundle') {
    if (filter.bundle !== SCHEDULED_DRAFTS) return entry.group === filter.bundle
    return releaseOf(world, entry.group)?.metadata.cardinality === 'one'
  }
  if (filter.kind === 'assignee') {
    // Only drafts are assigned; a draft with no assignee is Unassigned.
    if (filter.person === UNASSIGNED) return entry.group === 'drafts' && !entry.assignee
    return entry.assignee === filter.person
  }
  if (filter.kind === 'editedBy') return entry.editedBy?.includes(filter.person) ?? false
  // A last edit counts back from the fixture's now by the row's relative time ("2d ago").
  const at =
    filter.kind === 'lastEdited'
      ? new Date(Date.parse(FIXTURE_NOW) - ageInHours(entry) * 3_600_000).toISOString()
      : (() => {
          const release = releaseOf(world, entry.group)
          return release?.metadata.releaseType === 'scheduled'
            ? release.metadata.intendedPublishAt
            : undefined
        })()
  if (!at) return false
  const day = startOfDay(new Date(at))
  const [from, to] = dateBounds(filter)
  return (
    day >= startOfDay(new Date(`${from}T00:00:00`)) && day <= startOfDay(new Date(`${to}T00:00:00`))
  )
}

/**
 * The query ranking: what a query sent now with the Perspective bar's perspective would serve,
 * and in which order it falls back (Faheem: "If someone were to send a query right now, what would
 * the priority look like?"; Andrej, 2026-10-15: "show which is the winning variant for a particular
 * perspective and show the fallback variants in order of priority under each other").
 *
 * The rule is an assumption until Pedro or Jordan say how the query resolves. The best-matching
 * variant wins: more conditions first, ties broken on priority, the base last. Only a version a
 * visitor can get is served: a published version, or one in the release or scheduled draft the bar
 * previews, which goes out when it publishes. Each variant serves its version in that release, else
 * its published version. A draft is never served (Andrej, 2026-10-20: "drafts are never served.
 * They need to be published to be served"), so with Drafts previewed the ranking is Published's
 * (Andrej, 2026-10-20: "It should be published.norwegian actually because the norwegian perspective
 * is selected"). Everything else is not served. Rows in `exclude` are skipped, which is how the
 * fallback after a delete is found.
 */
function priorityRanking(
  world: InventoryWorld,
  visitor: Visitor,
  release: string,
  exclude: ReadonlySet<string> = new Set(),
): InventoryEntry[] {
  return rankIn(
    world,
    visitor,
    release === 'published' || release === 'drafts' ? ['published'] : [release, 'published'],
    exclude,
  )
}

/**
 * The versions in `bundles` that match the visitor, best first: more conditions, then priority,
 * the base last; a variant's versions stay together, in the order of `bundles`.
 */
function rankIn(
  world: InventoryWorld,
  visitor: Visitor,
  bundles: string[],
  exclude: ReadonlySet<string> = new Set(),
): InventoryEntry[] {
  // Variants that tie on match and priority keep the fixture's order, and each keeps its versions
  // together.
  const variantOrder = [...new Set(world.entries.map((entry) => entry.variantId ?? ''))]
  return world.entries
    .filter((entry) => !exclude.has(entry.key) && bundles.includes(entry.group))
    .map((entry) => ({entry, match: matchVariant(variantFor(world, entry), visitor)}))
    .filter(({match}) => match.kind !== 'none')
    .sort(
      (a, b) =>
        tier(b.match) - tier(a.match) ||
        priorityOf(world, b.entry) - priorityOf(world, a.entry) ||
        variantOrder.indexOf(a.entry.variantId ?? '') -
          variantOrder.indexOf(b.entry.variantId ?? '') ||
        bundles.indexOf(a.entry.group) - bundles.indexOf(b.entry.group),
    )
    .map(({entry}) => entry)
}

/** The row the visitor is served: the first of the query ranking. */
function shownEntryKey(
  world: InventoryWorld,
  visitor: Visitor,
  release: string,
  exclude: ReadonlySet<string> = new Set(),
): string | undefined {
  return priorityRanking(world, visitor, release, exclude)[0]?.key
}

/** The proposal for J3, not checked against Studio: what this visitor is served once it is gone. */
function fallbackText(
  world: InventoryWorld,
  fallbackKey: string | undefined,
  count: number,
): string {
  const it = count === 1 ? 'it' : 'them'
  const entry = world.entries.find((e) => e.key === fallbackKey)
  if (!entry) return `If you delete ${it}, this visitor sees no version of this document.`
  const where =
    entry.group === 'published'
      ? 'published'
      : entry.group === 'drafts'
        ? 'draft'
        : releaseTitle(world, entry.group)
  return `If you delete ${it}, this visitor sees the ${where} ${titleOf(world, entry)} instead.`
}

/**
 * What the delete dialog says this visitor gets instead, when the selection holds the version the
 * visitor is served (Andrej, 2026-10-20: "that information of the fallback needs to go into the
 * delete dialog"); `undefined` when the served version stays.
 */
export function deleteFallbackText(
  world: InventoryWorld,
  visitor: Visitor,
  release: string,
  selectedKeys: ReadonlySet<string>,
): string | undefined {
  const shownKey = shownEntryKey(world, visitor, release)
  if (!shownKey || !selectedKeys.has(shownKey)) return undefined
  return fallbackText(
    world,
    shownEntryKey(world, visitor, release, selectedKeys),
    selectedKeys.size,
  )
}

/** Whether the Perspective bar shows a release or scheduled draft, not Drafts or Published. */
const isReleaseBar = (release: string) => release !== 'drafts' && release !== 'published'

/**
 * The bundles a visitor's query reads, in serving order: a release, then the releases Studio sorts
 * after it (`getReleasesPerspectiveStack` over `sortReleases`), the ones that go out before it,
 * then published. Drafts are never served (Andrej, 2026-10-20: "drafts are never served"), so
 * with Drafts or Published in the bar it reads published alone.
 */
function servingOrder(world: InventoryWorld, release: string): string[] {
  if (!isReleaseBar(release)) return ['published']
  const sorted = sortReleases(world.releases).map((doc) => doc.name)
  const at = sorted.indexOf(release)
  return [...(at === -1 ? [release] : sorted.slice(at)), 'published']
}

/**
 * The exact variant's short id: the variant whose conditions equal the bar's values. "All" in a
 * dimension is no condition (Andrej, 2026-10-20: "all means no condition"), so with every
 * dimension on All the base is exact, as `{id: undefined}`. `undefined` when no variant is exact.
 */
function exactVariantOf(
  world: InventoryWorld,
  visitor: Visitor,
): {id: string | undefined} | undefined {
  if (Object.values(visitor).every((value) => value === undefined)) return {id: undefined}
  const variant = findExactVariant(world, visitor)
  return variant ? {id: variant._id.slice(VARIANT_DOCUMENTS_PATH.length + 1)} : undefined
}

/**
 * What the inventory's bottom bar says for the bar's perspective (Andrej, 2026-10-20: "move the
 * informational area … to the button, absorb the Create variant button and make it contextual to
 * the selected perspective"): one fact line when the bar's exact version is missing, and one
 * action. The line names facts only (Andrej: "make the description more neutral").
 */
export interface ServedAnswer {
  /** The version a visitor gets; the list marks it. `undefined` when none is served. */
  served: InventoryEntry | undefined
  /** What is missing, as a fact; `undefined` when nothing is. */
  line: string | undefined
  /** The card's one button: "Add missing variant" when something is missing, else "Create variant". */
  action: string
  /** What the action adds: a version of the exact variant in a bundle, a variant, or nothing. */
  missing:
    | {kind: 'version'; bundle: string; variantId: string | undefined}
    | {kind: 'variant'}
    | undefined
}

/**
 * The version a visitor gets, in serving order: a release, then the releases that go out before
 * it, then published. Drafts are never served (Andrej, 2026-10-20: "drafts are never served"), so
 * with Drafts or Published in the bar a visitor gets the published version. The exact variant's
 * version comes first; with none in that order, the best match.
 */
export function servedEntryOf(
  world: InventoryWorld,
  visitor: Visitor,
  release: string,
): InventoryEntry | undefined {
  const order = servingOrder(world, release)
  const exact = exactVariantOf(world, visitor)
  const ofExact = (bundle: string) =>
    exact
      ? world.entries.find((entry) => entry.group === bundle && entry.variantId === exact.id)
      : undefined
  return order.flatMap((bundle) => ofExact(bundle) ?? [])[0] ?? rankIn(world, visitor, order)[0]
}

export function servedAnswer(options: {
  world: InventoryWorld
  visitor: Visitor
  release: string
}): ServedAnswer {
  return servedFact(options)
}

function servedFact(options: {
  world: InventoryWorld
  visitor: Visitor
  release: string
}): ServedAnswer {
  const {world, visitor, release} = options
  const exact = exactVariantOf(world, visitor)
  const inBar = exact
    ? world.entries.find((entry) => entry.group === release && entry.variantId === exact.id)
    : undefined
  const exactTitle = exact?.id
    ? (variantsById(world).get(exact.id)?.metadata?.title ?? exact.id)
    : baseNames().inventory
  // The bar's values, in dimension order, name a variant no definition carries, joined as a
  // sentence (Andrej, 2026-10-21: "No variant for Danish and New visitors.").
  const titles = worldDimensions(world).flatMap((dimension) => {
    const option = dimension.values.find((o) => o.value === visitor[dimension.name])
    return option ? [option.title] : []
  })
  const values =
    titles.length > 1 ? `${titles.slice(0, -1).join(', ')} and ${titles.at(-1)}` : titles.join('')
  const served = servedEntryOf(world, visitor, release)
  if (!exact) {
    return {
      served,
      line: `No variant for ${values}.`,
      action: 'Add missing variant',
      missing: {kind: 'variant'},
    }
  }
  if (inBar) return {served, line: undefined, action: 'Create variant', missing: undefined}
  const missing = {kind: 'version' as const, bundle: release, variantId: exact.id}
  if (release === 'drafts') {
    return {
      served,
      line: `${exactTitle} has no draft.`,
      action: 'Add missing variant',
      missing,
    }
  }
  const barName = releaseTitle(world, release as InventoryGroupId)
  return {
    served,
    line:
      release === 'published'
        ? `${exactTitle} has no published version.`
        : `${barName} has no ${exactTitle} version.`,
    action: 'Add missing variant',
    missing,
  }
}

/**
 * Whether a version matches the search text (Andrej, 2026-10-20: "implement the search
 * functionality that allows free text filtering"): its title, its variant's name, its bundle and
 * the fields it changes, ignoring case.
 */
function matchesSearch(world: InventoryWorld, entry: InventoryEntry, search: string): boolean {
  const query = search.trim().toLowerCase()
  if (!query) return true
  const bundle =
    entry.group === 'drafts'
      ? 'Draft'
      : entry.group === 'published'
        ? 'Published'
        : releaseTitle(world, entry.group)
  const text = [
    variantsOn(world) ? titleOf(world, entry) : worldDocument(world).title,
    variantFor(world, entry)?.metadata?.title,
    bundle,
    ...entry.changedFields,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return text.includes(query)
}

/** The versions a view lists under its filters and search, before grouping. */
function visibleEntries(options: {
  world: InventoryWorld
  visitor: Visitor
  release: string
  view: InventoryView
  filters: Filter[]
  search?: string
}): InventoryEntry[] {
  const {world, visitor, view, filters, search = ''} = options
  const passes = (entry: InventoryEntry) =>
    filters.every((f) => filterMatches(world, visitor, f, entry)) &&
    matchesSearch(world, entry, search)
  return world.entries.filter((entry) =>
    // The timeline holds what is live or will go live; By stage holds every version.
    // Open beta (approved by Faheem, 22 Oct): By publish date lists the drafts too (was: drafts only in By stage).
    passes(entry),
  )
}

export function buildGroups(options: {
  world: InventoryWorld
  visitor: Visitor
  release: string
  view: InventoryView
  groupBy?: GroupBy
  sort?: Sort
  filters?: Filter[]
  search?: string
  /** The ⋯ menu's Show empty groups: a group with no rows keeps its header and an empty line. */
  showEmptyGroups?: boolean
  selectedKeys?: ReadonlySet<string>
  editedEntryKey: string | undefined
}): InventoryGroup[] {
  const {world, visitor, release, view, editedEntryKey} = options
  const filters = options.filters ?? []
  const selectedKeys = options.selectedKeys ?? new Set<string>()
  const groupBy: GroupBy = options.groupBy ?? 'release'
  const {sort} = options

  const visible = visibleEntries({world, visitor, release, view, filters, search: options.search})
  // The version visitors get keeps its place in the list; its label names it.
  const servedKey = variantsOn(world) ? servedEntryOf(world, visitor, release)?.key : undefined

  const toRow = (entry: InventoryEntry): InventoryRow => {
    const variant = variantFor(world, entry)
    const match = matchVariant(variant, visitor)
    const isBase = !variant
    const isShown = entry.key === servedKey
    const isSelected = selectedKeys.has(entry.key)
    // The highlight alone marks the version the form edits; only the served row gets a label.
    // With variants off every row is the document itself: no base to name, no diamond.
    const detail = isBase && variantsOn(world) ? 'Base document' : changesText(entry)
    // By stage's subtitle is the last edit, then the fields changed (Andrej, 2026-10-20: "For the
    // subtitle we just want the last edited date and then which fields changed"); the row puts the
    // edit time in front, in Studio's format.
    const moment = view === 'stage' ? undefined : publishMoment(world, entry)
    const subtitle = [moment, detail].filter(Boolean).join(' · ')
    const title = variantsOn(world) ? titleOf(world, entry) : worldDocument(world).title
    return {
      entry,
      variant,
      title,
      subtitle,
      match,
      isBase,
      isHere: entry.key === editedEntryKey,
      isShown,
      isSelected,
      editedAt:
        view === 'stage'
          ? new Date(Date.parse(FIXTURE_NOW) - ageInHours(entry) * 3_600_000).toISOString()
          : undefined,
      statusLabel:
        view === 'stage'
          ? `${title} · ${entry.group === 'drafts' ? 'Draft' : releaseTitle(world, entry.group)}`
          : undefined,
    }
  }

  const compare = (a: InventoryRow, b: InventoryRow): number => {
    if (!sort) return 0
    const dir = sort.order === 'asc' ? 1 : -1
    if (sort.by === 'name') return dir * a.title.localeCompare(b.title)
    if (sort.by === 'lastEdited') return dir * (ageInHours(b.entry) - ageInHours(a.entry))
    // Publish date: by the bundle a row goes out with, the earliest first for "Ascending".
    const order = publishDateOrder(world)
    return dir * (order.indexOf(a.entry.group) - order.indexOf(b.entry.group))
  }

  const rowsWhere = (predicate: (entry: InventoryEntry) => boolean) =>
    visible.filter(predicate).map(toRow).sort(compare)

  let groups: InventoryGroup[]
  if (view === 'stage') {
    groups = [
      ...STAGES.map(([stage, title, icon]) => ({
        id: `stage-${stage}`,
        title,
        ...icon,
        rows: rowsWhere((entry) => entry.group !== 'published' && stageOf(entry) === stage),
      })),
      // Published closes the workflow, at the very bottom (Andrej, 2026-10-14).
      {
        id: 'stage-published',
        title: 'Published',
        icon: 'published' as const,
        rows: rowsWhere((entry) => entry.group === 'published'),
      },
    ]
  } else if (groupBy === 'none') {
    groups = [{id: 'all', title: undefined, rows: rowsWhere(() => true)}]
  } else if (groupBy === 'release' && view === 'publishDate') {
    const slots = timelineSlots(world)
    // Descending publish date runs the timeline backwards: the last bundle to go out comes first.
    if (sort?.by === 'publishDate' && sort.order === 'desc') slots.reverse()
    groups = slots.map((slot) => ({
      id: slot.id,
      title: slot.title,
      secondary: slot.secondary,
      secondaryJoin: ' · ',
      icon: slot.icon,
      rows: rowsWhere((entry) => slot.bundles.includes(entry.group)),
    }))
  } else if (groupBy === 'release') {
    groups = GROUP_ORDER.map((id) => ({
      id,
      // A scheduled draft is named by its date alone here too (Andrej, 2026-10-15).
      ...(releaseOf(world, id)?.metadata.cardinality === 'one'
        ? {title: capitalise(releaseDateLabel(world, id) ?? releaseTitle(world, id))}
        : {title: releaseTitle(world, id), secondary: releaseDateLabel(world, id)}),
      icon: groupIcon(world, id),
      rows: rowsWhere((entry) => entry.group === id),
    }))
  } else {
    const dimension = worldDimensions(world).find((d) => d.name === groupBy)!
    groups = [
      ...dimension.values.map((option) => ({
        id: `${groupBy}-${option.value}`,
        title: option.title,
        rows: rowsWhere(
          (entry) => variantFor(world, entry)?.conditions?.[groupBy] === option.value,
        ),
      })),
      {
        id: `${groupBy}-none`,
        title: `No ${dimension.title.toLowerCase()}`,
        rows: rowsWhere((entry) => variantFor(world, entry)?.conditions?.[groupBy] === undefined),
      },
    ]
  }
  // Show empty groups keeps a group with no rows, with an empty line under its header (Andrej,
  // 2026-10-20: "The show empty groups should work").
  if (options.showEmptyGroups) {
    groups = groups.map((group) =>
      group.title !== undefined && group.emptyText === undefined
        ? {...group, emptyText: 'No versions.'}
        : group,
    )
  }
  return groups.filter((group) => group.rows.length > 0 || group.emptyText !== undefined)
}

interface InventoryConceptsValue {
  /** The releases and versions this story's inventory lists. */
  world: InventoryWorld
  visitor: Visitor
  setDimension: (dimension: DimensionName, value: string | undefined) => void
  release: string
  setRelease: (release: string) => void
  view: InventoryView
  setView: (view: InventoryView) => void
  /**
   * Opens the panel in the view for the bar's release, once per release group: By stage for Drafts
   * and Published, By publish date for a release. A saved view the editor picked stays.
   */
  applyDefaultView: () => void
  /** Forgets the applied default, so the next opening applies it again. Called on close. */
  resetDefaultView: () => void
  /** The saved views, in the order the views menu lists them. */
  savedViews: SavedView[]
  /** The saved view the panel shows, until the editor picks a view. */
  savedViewId: string | undefined
  /** Restores a saved view's view, filters and sort. */
  selectSavedView: (id: string) => void
  /** Keeps the current view, filters and sort under `name`, and selects it. */
  saveView: (name: string) => void
  /**
   * Deletes a saved view and returns the undo, which puts it back in its place. A deleted view that
   * was selected leaves the panel on its view, filters and sort.
   */
  deleteSavedView: (id: string) => () => void
  /** What the toolbar's view button reads: the saved view's name, else the view's. */
  viewLabel: string
  groupBy: GroupBy
  setGroupBy: (groupBy: GroupBy) => void
  sort: Sort
  setSort: (sort: Sort) => void
  filters: Filter[]
  addFilter: (filter: Filter) => void
  removeFilter: (index: number) => void
  /**
   * The filter bar shows: the toolbar's filter button turns it on and off, and hiding it keeps the
   * filters (Andrej, 2026-10-20: "The filter button should just turn on and off … the filter bar";
   * "Hiding keeps the filters"). A saved view with filters opens it.
   */
  filterBarOpen: boolean
  /** The search field's text, `undefined` while it is closed; it narrows every view. */
  search: string | undefined
  setSearch: (search: string | undefined) => void
  /** The ⋯ menu's Show empty groups, off until turned on. */
  showEmptyGroups: boolean
  toggleShowEmptyGroups: () => void
  toggleFilterBar: () => void
  /**
   * The Specific date calendar is open, and whether its next day click extends the span. Held here,
   * not in the menu: the first pick closes the menu and brings the filter bar in, and the calendar
   * has to stay open through both.
   */
  datePicker: DateKind | undefined
  setDatePicker: (kind: DateKind | undefined) => void
  spanExtending: boolean
  setSpanExtending: (extending: boolean) => void
  /**
   * How many versions this view would list with a filter picked: the other filters stay, and the
   * filter replaces any of its own kind (Andrej, 2026-10-15: "add how many versions fit a specific
   * filter in (brackets). Apply this as a pattern to all filters across all views").
   */
  countWith: (filter: Filter) => number
  /** Removes every filter; the filter bar stays open. */
  resetFilters: () => void
  selectedKeys: ReadonlySet<string>
  toggleSelected: (keys: string[]) => void
  clearSelection: () => void
  /** The highlighted row, or `undefined` when the chosen release holds no version for the variant. */
  currentEntryKey: string | undefined
  /** The definition the dimensions name exactly; `undefined` for the base or when none exists. */
  exactVariant: SystemVariant | undefined
  /** Set when dimensions are chosen that no variant definition names. */
  hasNoDefinition: boolean
  selectEntry: (entry: InventoryEntry) => void
  /** Counts row choices, so a placement can react to one (B's popover closes). */
  entrySelections: number
  groups: InventoryGroup[]
  versionCount: number
  visibleCount: number
  /** Whether the Perspective bar shows; see `barUntilVariant`. */
  barVisible: boolean
  /** Shows or hides the Perspective bar, keeping the perspective; undefined where it always shows. */
  toggleBar: (() => void) | undefined
  /** Shows the Perspective bar if it is hidden; undefined where it always shows. */
  showBar: (() => void) | undefined
  /** Drafts with every dimension selector on All. */
  perspectiveIsDefault: boolean
  /** What the bottom bar says and does for the bar's perspective, and which version is served. */
  answer: ServedAnswer
  /** Adds the bar's missing version of the exact variant to the prototype's versions. */
  addMissingVersion: () => void
}

const InventoryConceptsContext = createContext<InventoryConceptsValue | null>(null)

/** The definition whose conditions are exactly the chosen dimension values. */
export function findExactVariant(
  world: InventoryWorld,
  visitor: Visitor,
): SystemVariant | undefined {
  const chosen = Object.entries(visitor).filter(([, value]) => value !== undefined)
  return worldVariants(world).find((variant) => {
    const conditions = Object.entries(variant.conditions ?? {})
    return (
      conditions.length === chosen.length &&
      chosen.every(([dimension, value]) => variant.conditions?.[dimension] === value)
    )
  })
}

export function shortVariantId(variant: SystemVariant): string {
  return variant._id.slice(VARIANT_DOCUMENTS_PATH.length + 1)
}

export function InventoryConceptsProvider(props: {
  children: ReactNode
  initialView?: InventoryView
  initialVisitor?: Visitor
  /**
   * Concept A (Andrej, 2026-10-14): the Perspective bar is hidden until a variant row is chosen in
   * the inventory, then stays visible until its close button hides it.
   */
  barUntilVariant?: boolean
  /** Another state of the inventory; the default is the board's. */
  world?: InventoryWorld
  /**
   * Which row is highlighted and what choosing one does, when the document is not the one the
   * Perspective bar steers: a referenced document's pane holds its own version, and choosing a row
   * switches that pane alone. Unset, choosing a row sets the bar.
   */
  selection?: {currentEntryKey: string | undefined; onSelect: (entry: InventoryEntry) => void}
}) {
  const {
    children,
    initialView = 'publishDate',
    initialVisitor = defaultVisitor,
    barUntilVariant,
    world: givenWorld = baseWorld,
    selection,
  } = props
  // Versions "Add missing variant" created, on top of the story's world. The prototype keeps them
  // here; Studio's form has no document for them.
  const [added, setAdded] = useState<InventoryEntry[]>([])
  const world = useMemo(
    () =>
      added.length > 0 ? {...givenWorld, entries: [...givenWorld.entries, ...added]} : givenWorld,
    [givenWorld, added],
  )
  const router = useRouter()
  const setPerspective = useSetPerspective()
  const stickyRelease = router.stickyParams.perspective
  const release = typeof stickyRelease === 'string' && stickyRelease ? stickyRelease : 'drafts'
  const [visitor, setVisitor] = useState<Visitor>(initialVisitor)
  const [view, setViewState] = useState<InventoryView>(initialView)
  const [
    savedViews,
    setSavedViews,
  ] = // LIVE: his seeded sample views are mock data; saved views are a fast follow, so the list starts empty.
    useState<SavedView[]>(NO_SAVED_VIEWS)
  const [savedViewId, setSavedViewId] = useState<string | undefined>()
  const savedViewCount = useRef(0)
  const [groupBy, setGroupBy] = useState<GroupBy>('release')
  // By publish date sorts by publish date unless the editor picks another sort (Andrej, 2026-10-14);
  // By stage by last edit until then. The sort menu reads the sort in force.
  const [chosenSort, setChosenSort] = useState<Sort>(DEFAULT_SORT)
  const [sortChosen, setSortChosen] = useState(false)
  const setSort = useCallback((next: Sort) => {
    setChosenSort(next)
    setSortChosen(true)
  }, [])
  const sort: Sort = view === 'stage' && !sortChosen ? STAGE_SORT : chosenSort
  const [filters, setFilters] = useState<Filter[]>([])
  const [filterBarOpen, setFilterBarOpen] = useState(false)
  // The search field: `undefined` while closed, else its text.
  const [search, setSearch] = useState<string | undefined>()
  const [showEmptyGroups, setShowEmptyGroups] = useState(false)
  const toggleShowEmptyGroups = useCallback(() => setShowEmptyGroups((show) => !show), [])
  const toggleFilterBar = useCallback(() => setFilterBarOpen((open) => !open), [])
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(new Set())

  const setView = useCallback((next: InventoryView) => {
    setViewState(next)
    setSavedViewId(undefined)
    // A filter only one view offers goes when the editor leaves that view; dimensions stay.
    setFilters((current) => current.filter((f) => filterOffered(f, next)))
  }, [])
  // The view the panel opens in follows the bar's release (Andrej, 2026-10-21: "when in the drafts
  // perspective or the published perspective we by default open the By Stage view … When release
  // is selected … we open the view in by Publishing Date"). It applies once per release group, so
  // a view the editor picks stays until the panel closes or the bar moves between Drafts or
  // Published and a release. The panel remounts on every perspective change, so this cannot key
  // on mounting.
  const defaultViewGroup = useRef<'base' | 'release' | undefined>(undefined)
  const releaseGroup = release === 'drafts' || release === 'published' ? 'base' : 'release'
  const applyDefaultView = useCallback(() => {
    if (defaultViewGroup.current === releaseGroup) return
    defaultViewGroup.current = releaseGroup
    if (savedViewId) return
    // Open beta (approved by Faheem, 22 Oct): By publish date in every perspective (was: By stage on Drafts and Published).
    setView('publishDate')
  }, [releaseGroup, savedViewId, setView])
  const resetDefaultView = useCallback(() => {
    defaultViewGroup.current = undefined
  }, [])
  const selectSavedView = useCallback(
    (id: string) => {
      const saved = savedViews.find((each) => each.id === id)
      if (!saved) return
      setViewState(saved.view)
      setFilters(saved.filters)
      if (saved.filters.length > 0) setFilterBarOpen(true)
      setSort(saved.sort)
      setSavedViewId(id)
    },
    [savedViews],
  )
  const saveView = useCallback(
    (name: string) => {
      savedViewCount.current += 1
      const id = `saved-view-${savedViewCount.current}`
      setSavedViews((current) => [...current, {id, name, view, filters, sort}])
      setSavedViewId(id)
    },
    [view, filters, sort],
  )
  const deleteSavedView = useCallback(
    (id: string) => {
      const index = savedViews.findIndex((each) => each.id === id)
      const deleted = savedViews[index]
      setSavedViews((current) => current.filter((each) => each.id !== id))
      setSavedViewId((current) => (current === id ? undefined : current))
      let undone = false
      return () => {
        if (undone || !deleted) return
        undone = true
        setSavedViews((current) => [...current.slice(0, index), deleted, ...current.slice(index)])
      }
    },
    [savedViews],
  )
  const addFilter = useCallback((filter: Filter) => {
    setFilters((current) => [...current.filter((f) => filterKey(f) !== filterKey(filter)), filter])
  }, [])
  const removeFilter = useCallback((index: number) => {
    setFilters((current) => current.filter((_, i) => i !== index))
  }, [])
  const resetFilters = useCallback(() => setFilters([]), [])
  const countWith = useCallback(
    (filter: Filter) =>
      visibleEntries({
        world,
        visitor,
        release,
        view,
        filters: [...filters.filter((f) => filterKey(f) !== filterKey(filter)), filter],
        search,
      }).length,
    [world, visitor, release, view, filters, search],
  )
  const [datePicker, setDatePicker] = useState<DateKind | undefined>()
  const [spanExtending, setSpanExtending] = useState(false)
  const toggleSelected = useCallback((keys: string[]) => {
    setSelectedKeys((current) => {
      const next = new Set(current)
      const allIn = keys.every((key) => next.has(key))
      for (const key of keys) {
        if (allIn) next.delete(key)
        else next.add(key)
      }
      return next
    })
  }, [])
  const clearSelection = useCallback(() => setSelectedKeys(new Set()), [])
  // Another document's rows share keys with this one's ("published.base"): a new document starts
  // with nothing selected.
  useEffect(() => setSelectedKeys(new Set()), [world])

  const setDimension = useCallback((dimension: DimensionName, value: string | undefined) => {
    setVisitor((current) => ({...current, [dimension]: value}))
  }, [])

  const setRelease = useCallback(
    (next: string) => setPerspective(next === 'drafts' ? undefined : (next as ReleaseId)),
    [setPerspective],
  )

  const [entrySelections, setEntrySelections] = useState(0)
  const [barShown, setBarShown] = useState(false)
  const selectEntry = useCallback(
    (entry: InventoryEntry) => {
      setEntrySelections((n) => n + 1)
      if (selection) {
        selection.onSelect(entry)
        return
      }
      if (entry.variantId) setBarShown(true)
      const variant = entry.variantId
        ? worldVariants(world).find((v) => shortVariantId(v) === entry.variantId)
        : undefined
      setVisitor({...(variant?.conditions as Visitor | undefined)})
      setRelease(entry.group)
    },
    [setRelease, selection, world],
  )

  const hasChosen = Object.values(visitor).some((value) => value !== undefined)
  const exactVariant = useMemo(() => findExactVariant(world, visitor), [world, visitor])
  const hasNoDefinition = hasChosen && !exactVariant
  const currentEntryKey = selection
    ? selection.currentEntryKey
    : hasNoDefinition
      ? undefined
      : world.entries.find(
          (entry) =>
            entry.group === release &&
            entry.variantId === (exactVariant ? shortVariantId(exactVariant) : undefined),
        )?.key

  const groups = useMemo(
    () =>
      buildGroups({
        world,
        visitor,
        release,
        view,
        groupBy,
        sort,
        filters,
        search,
        showEmptyGroups,
        selectedKeys,
        editedEntryKey: currentEntryKey,
      }),
    [
      world,
      visitor,
      release,
      view,
      groupBy,
      sort,
      filters,
      search,
      showEmptyGroups,
      selectedKeys,
      currentEntryKey,
    ],
  )
  const visibleCount = groups.reduce((n, group) => n + group.rows.length, 0)
  const answer = useMemo(
    () => servedAnswer({world, visitor, release}),
    [world, visitor, release, currentEntryKey, selectedKeys],
  )
  // Adds the bar's missing version of the exact variant: a draft with Drafts in the bar, else a
  // version in the bar's bundle. It starts as a copy of the variant's latest version's changes.
  const addMissingVersion = useCallback(() => {
    const missing = answer.missing
    if (missing?.kind !== 'version') return
    const like = world.entries.find((entry) => entry.variantId === missing.variantId)
    setAdded((current) => [
      ...current,
      {
        key: `${missing.bundle}.${missing.variantId ?? 'base'}`,
        group: missing.bundle as InventoryGroupId,
        variantId: missing.variantId,
        changedFields: like?.changedFields ?? [],
        updated: '0h ago',
        ...(missing.bundle === 'drafts' ? {stage: 'draft' as const, editedBy: [ME]} : {}),
      },
    ])
  }, [answer.missing, world.entries])
  const barVisible = !barUntilVariant || barShown
  // The navbar eye hides and shows the bar; hiding keeps the perspective (Andrej, 2026-10-14: "the
  // perspective bar should not be closed"; keeping it is the Captain's call, pending Andrej).
  const toggleBar = useMemo(
    () => (barUntilVariant && variantsOn(world) ? () => setBarShown((shown) => !shown) : undefined),
    [barUntilVariant, world],
  )
  // Opening the inventory from Manage versions brings the bar in (Andrej, 2026-10-21: "Once manage
  // versions is clicked, the perspective bar should appear"). Closing it leaves the bar as it is.
  const showBar = useMemo(
    () => (barUntilVariant && variantsOn(world) ? () => setBarShown(true) : undefined),
    [barUntilVariant, world],
  )
  const perspectiveIsDefault =
    release === 'drafts' && Object.values(visitor).every((value) => value === undefined)

  const value = useMemo(
    (): InventoryConceptsValue => ({
      world,
      visitor,
      setDimension,
      release,
      setRelease,
      view,
      setView,
      applyDefaultView,
      resetDefaultView,
      savedViews,
      savedViewId,
      selectSavedView,
      saveView,
      deleteSavedView,
      viewLabel: savedViews.find((each) => each.id === savedViewId)?.name ?? VIEW_LABELS[view],
      groupBy,
      setGroupBy,
      sort,
      setSort,
      filters,
      addFilter,
      removeFilter,
      filterBarOpen,
      search,
      setSearch,
      showEmptyGroups,
      toggleShowEmptyGroups,
      toggleFilterBar,
      resetFilters,
      countWith,
      datePicker,
      setDatePicker,
      spanExtending,
      setSpanExtending,
      selectedKeys,
      toggleSelected,
      clearSelection,
      currentEntryKey,
      exactVariant,
      hasNoDefinition,
      selectEntry,
      entrySelections,
      groups,
      versionCount: world.entries.length,
      visibleCount,
      barVisible,
      toggleBar,
      showBar,
      perspectiveIsDefault,
      answer,
      addMissingVersion,
    }),
    [
      world,
      visitor,
      setDimension,
      release,
      setRelease,
      view,
      setView,
      applyDefaultView,
      resetDefaultView,
      savedViews,
      savedViewId,
      selectSavedView,
      saveView,
      deleteSavedView,
      groupBy,
      sort,
      filters,
      addFilter,
      removeFilter,
      filterBarOpen,
      search,
      setSearch,
      showEmptyGroups,
      toggleShowEmptyGroups,
      toggleFilterBar,
      resetFilters,
      countWith,
      datePicker,
      setDatePicker,
      spanExtending,
      setSpanExtending,
      selectedKeys,
      toggleSelected,
      clearSelection,
      currentEntryKey,
      exactVariant,
      hasNoDefinition,
      selectEntry,
      entrySelections,
      groups,
      visibleCount,
      barVisible,
      toggleBar,
      showBar,
      perspectiveIsDefault,
      answer,
      addMissingVersion,
    ],
  )

  // A name no definition carries makes Studio's form show its "variant not found" state, the
  // honest result of dimensions that name no variant.
  const selectedVariantName = exactVariant
    ? shortVariantId(exactVariant)
    : hasNoDefinition
      ? worldDimensions(world)
          .flatMap(
            (dimension) =>
              dimension.values.find((option) => option.value === visitor[dimension.name])?.title ??
              [],
          )
          .join(' · ')
      : undefined

  return (
    <InventoryConceptsContext.Provider value={value}>
      <PerspectiveProvider
        selectedPerspectiveName={
          release === 'drafts' ? undefined : (release as ReleaseId | 'published')
        }
        selectedVariantName={selectedVariantName}
      >
        {children}
      </PerspectiveProvider>
    </InventoryConceptsContext.Provider>
  )
}

export function useInventoryConcepts(): InventoryConceptsValue {
  const value = useContext(InventoryConceptsContext)
  if (!value) throw new Error('useInventoryConcepts must be used inside InventoryConceptsProvider')
  return value
}
