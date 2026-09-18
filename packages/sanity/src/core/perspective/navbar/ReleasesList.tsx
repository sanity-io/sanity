import {Card, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {type ChangeEvent, type JSX, useCallback, useMemo} from 'react'
import {styled} from 'styled-components'
import {Flex} from 'ui5'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {CreateReleaseMenuItem} from '../../releases/components/CreateReleaseMenuItem'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST} from '../../releases/util/const'
import {
  filterReleasesForSearch,
  matchesSearchTerm,
  RELEASE_FILTER_THRESHOLD,
} from '../../releases/util/filterReleasesForSearch'
import {useAgentBundles} from '../../store/agent/useAgentBundles'
import {useWorkspace} from '../../studio/workspace'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {usePerspectiveActiveDocument} from '../activeDocument/usePerspectiveActiveDocument'
import {MENU_PINNED_BLOCK_HEIGHT_VAR} from '../styles'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {AgentBundleMenuItem} from './AgentBundleMenuItem'
import {GlobalPerspectiveMenuItem} from './GlobalPerspectiveMenuItem'
import {DocumentReleaseSections, ReleaseTypeSections} from './ReleaseMenuSections'
import {ScheduledDraftsMenuItem} from './ScheduledDraftsMenuItem'
import {useScheduledDraftsAvailable} from './useScheduledDraftsAvailable'
import {ViewContentReleasesMenuItem} from './ViewContentReleasesMenuItem'

const StickyCard = styled(Card)`
  position: sticky;
  z-index: 2;
  background: var(--card-bg-color);
`

const StickyTopCard = styled(StickyCard)`
  top: 0;
`

const StickyBottomCard = styled(StickyCard)`
  bottom: 0;
  /* Every element that can precede this card draws its own bottom border - a release section, the
     published/drafts card, the agent bundle card, or the filter block - so this card's top border
     landed against one and the pair read as a single 2px rule. Pulling up by exactly one border
     width overlaps them, and this card's opaque background hides the one underneath. The top
     border has to stay: while the list scrolls, rows pass beneath this card and that border is
     the only thing separating them. */
  margin-top: -1px;

  /* The action rows' icons have to line up with the column of status dots and release icons above
     them, and the shared MenuItem hardcodes its left inset to a 12px scale step - on its inner
     Box, so a \`style\` on the item itself stacks with it rather than replacing it. Overriding
     that box is the only way to reach the value, and it belongs here, once, rather than as a
     layout prop threaded through three item components (one of which the document context menu
     also renders).

     Why 11px and not a scale step: ink, not boxes. \`ReleaseAvatarIcon size="small"\` draws a 7px
     dot centred in a 25px svg, so the status dots' ink starts ~9px inside their box while these
     @sanity/icons glyphs nearly fill theirs. Equal boxes (12px) left the action ink 3.4px short of
     the dots'; matching the dots exactly put it 2px right of the bolt and clock row icons, whose
     wider glyphs sit at 12.6px. Nothing on the 4px scale lands between, and 11px puts the action
     ink at 13.6px - between the dots' 14.0-14.6px and the release icons' 12.6px, which is where
     design review settled it (PopoverMenu node 7576:27957). */
  [data-ui='MenuItem'] > [data-ui='Box'] {
    padding-left: 11px;
  }
`

export function ReleasesList({
  areReleasesEnabled,
  handleOpenBundleDialog,
  menuItemProps,
  filterQuery,
  onFilterQueryChange,
}: {
  areReleasesEnabled: boolean
  handleOpenBundleDialog: () => void
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  filterQuery: string
  onFilterQueryChange: (query: string) => void
}): JSX.Element {
  const {t} = useTranslation()
  const {loading, data: allReleases} = useActiveReleases()
  const {bundles: agentBundles} = useAgentBundles()
  const {activeDocument} = usePerspectiveActiveDocument()
  const isScheduledDraftsAvailable = useScheduledDraftsAvailable()

  const releases = useMemo(
    () => allReleases.filter((release) => !isCardinalityOneRelease(release)),
    [allReleases],
  )

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  // Filtering turns the panel into a result list: the time bands, the published/drafts pair and the
  // actions are all things you navigate with, and none of them answers what you typed. Published
  // and Drafts are matched on their own labels rather than left in place — typing "pub" should not
  // leave Published sitting above a "no results" message.
  // Counted before the search, never after: narrowing the list past the threshold would otherwise
  // pull the input out from under the person typing, and take their term with it.
  const showFilter = releases.length >= RELEASE_FILTER_THRESHOLD
  const isFiltering = filterQuery.trim().length > 0
  // Matched against the strings the rows render, not the chip strings: `release.chip.draft` is
  // "Draft" while the row says "Drafts", so matching the chip meant typing the visible word never
  // found it.
  const showPublished = matchesSearchTerm(t('release.navbar.published'), filterQuery)
  const showDrafts =
    isDraftModelEnabled && matchesSearchTerm(t('release.navbar.drafts'), filterQuery)

  const filteredReleases = useMemo(
    () => filterReleasesForSearch(releases, filterQuery),
    [filterQuery, releases],
  )

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onFilterQueryChange(event.currentTarget.value),
    [onFilterQueryChange],
  )

  // Publish the pinned block's height so the section headings can pin directly below it —
  // `MENU_PINNED_BLOCK_HEIGHT_VAR` explains why an offset is needed at all.
  //
  // A callback ref rather than an effect over `useRef`, because an effect has to name a dependency
  // that changes when the node appears and there is not always one: this ran on `loading`, which
  // only happens to flip after the data arrives. Where it does not — cached releases, so `loading`
  // is false from the first render — the effect fires once against a ref that has not attached and
  // is never invited back, and every heading then pins at the 0px fallback, underneath the filter
  // block itself. The variant menu hit exactly that. This fires when the node attaches instead.
  const observePinnedBlock = useCallback((pinned: HTMLDivElement | null) => {
    if (!pinned) return undefined

    // The menu, not the nearest card: this block is itself a `Card`, so a card lookup finds the
    // block and publishes the height onto the very element the headings need to clear. Custom
    // properties inherit, so the menu is as good an owner and is one both menus can name.
    const root = pinned.closest<HTMLElement>('[data-ui="Menu"]')
    if (!root) return undefined

    const publish = () =>
      root.style.setProperty(MENU_PINNED_BLOCK_HEIGHT_VAR, `${pinned.offsetHeight}px`)

    publish()

    // The block changes height in use: the Drafts row is conditional on the workspace, and the
    // filter input can wrap.
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(publish)
    observer.observe(pinned)
    return () => observer.disconnect()
  }, [])

  if (loading) {
    return (
      <Flex padding={4} justifyContent="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Card radius={3}>
      {/* Only the filter is pinned. Published and drafts used to be pinned with it, which made the
          panel a fixed top, a scrolling middle and a fixed bottom — and hid the fact that these two
          are the first entries in the same time order as the releases below: published is live now,
          drafts is the indefinite next, then asap, then dated, then undecided. */}
      {showFilter && (
        <StickyTopCard borderBottom ref={observePinnedBlock}>
          {/* 4px around a 33px input is the design's 41px block (PopoverMenu node 6998:20254:
              Filter frame 247x41, TextInput inset at 4,4). Borderless with it: the design reads the
              filter as placeholder text on the panel, with this card's own hairline beneath, rather
              than as a field boxed inside the menu. */}
          <Card padding={1}>
            <TextInput
              border={false}
              data-testid="release-menu-filter"
              fontSize={1}
              onChange={handleFilterChange}
              placeholder={t('release.menu.filter-placeholder')}
              radius={2}
              value={filterQuery}
            />
          </Card>
        </StickyTopCard>
      )}
      {(showPublished || showDrafts) && (
        <Card borderBottom padding={1}>
          <Stack gap={1}>
            {/* These two are rendered here rather than through `ReleaseTypeMenuSection`, so they
                need the term passed explicitly — without it they were filtered on their labels but
                never marked, which read as the marking being broken for them. */}
            {showPublished && (
              <GlobalPerspectiveMenuItem
                release={'published'}
                menuItemProps={menuItemProps}
                searchTerm={filterQuery}
              />
            )}
            {showDrafts && (
              <GlobalPerspectiveMenuItem
                release={LATEST}
                menuItemProps={menuItemProps}
                searchTerm={filterQuery}
              />
            )}
          </Stack>
        </Card>
      )}
      {agentBundles[0] && (
        <Card borderBottom padding={1}>
          <Stack gap={1}>
            <AgentBundleMenuItem bundle={agentBundles[0]} />
          </Stack>
        </Card>
      )}
      {areReleasesEnabled && (
        <Stack data-ui="scroll-wrapper">
          {activeDocument ? (
            <DocumentReleaseSections
              documentId={activeDocument.documentId}
              releases={filteredReleases}
              menuItemProps={menuItemProps}
              searchTerm={filterQuery}
            />
          ) : (
            <ReleaseTypeSections
              releases={filteredReleases}
              menuItemProps={menuItemProps}
              searchTerm={filterQuery}
            />
          )}
        </Stack>
      )}
      {/* The card carries the border, so it must not render when every item inside it is hidden:
          releases off and scheduled drafts unavailable leaves a divider with nothing under it. */}
      {isFiltering && !showPublished && !showDrafts && filteredReleases.length === 0 && (
        <Card padding={4} data-testid="release-menu-no-results">
          <Text align="center" muted size={1}>
            {t('release.menu.no-results', {searchTerm: filterQuery.trim()})}
          </Text>
        </Card>
      )}
      {!isFiltering && (areReleasesEnabled || isScheduledDraftsAvailable) && (
        <StickyBottomCard borderTop padding={1} data-testid="release-menu-actions">
          <Stack gap={1}>
            <ScheduledDraftsMenuItem />
            {areReleasesEnabled && (
              <>
                <ViewContentReleasesMenuItem />
                <CreateReleaseMenuItem
                  onCreateRelease={handleOpenBundleDialog}
                  text={t('release.menu.create-release')}
                />
              </>
            )}
          </Stack>
        </StickyBottomCard>
      )}
    </Card>
  )
}
