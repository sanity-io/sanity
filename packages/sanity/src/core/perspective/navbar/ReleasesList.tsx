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

const StickyBottomCard = styled(StickyCard)`
  bottom: 0;
  /* Every element that can precede this card draws its own bottom border - a release section, the
     published/drafts card, the agent bundle card, or the filter block - so this card's top border
     landed against one and the pair read as a single 2px rule. Pulling up by exactly one border
     width overlaps them, and this card's opaque background hides the one underneath. The top
     border has to stay: while the list scrolls, rows pass beneath this card and that border is
     the only thing separating them. */
  margin-top: -1px;
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

  if (loading) {
    return (
      <Flex padding={4} justifyContent="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Card radius={3}>
      {/* The filter scrolls with the list rather than holding the top edge. It sits at the head of
          the list, so scrolling away from the top carries it out of view and returning brings it
          back — the same relationship published and drafts have with the releases under them.
          Nothing above the list is pinned now, which is why the section headings pin at the top
          edge itself rather than against a measured offset. */}
      {showFilter && (
        <Card borderBottom>
          <Card padding={2}>
            <TextInput
              data-testid="release-menu-filter"
              fontSize={1}
              onChange={handleFilterChange}
              placeholder={t('release.menu.filter-placeholder')}
              radius={2}
              value={filterQuery}
            />
          </Card>
        </Card>
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
        <StickyBottomCard borderTop paddingY={1} paddingX={2} data-testid="release-menu-actions">
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
