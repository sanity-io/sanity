import {Card, Spinner, Stack, TextInput} from '@sanity/ui'
import {type ChangeEvent, type JSX, useCallback, useEffect, useMemo, useRef} from 'react'
import {styled} from 'styled-components'
import {Flex} from 'ui5'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {CreateReleaseMenuItem} from '../../releases/components/CreateReleaseMenuItem'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST} from '../../releases/util/const'
import {filterReleasesForSearch} from '../../releases/util/filterReleasesForSearch'
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
  const rootRef = useRef<HTMLDivElement | null>(null)
  const pinnedRef = useRef<HTMLDivElement | null>(null)
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

  // Published and Drafts stay put while filtering, matching how the variant menu
  // treats its own default entry.
  const filteredReleases = useMemo(
    () => filterReleasesForSearch(releases, filterQuery),
    [filterQuery, releases],
  )

  const handleFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onFilterQueryChange(event.currentTarget.value),
    [onFilterQueryChange],
  )

  // Publish the pinned block's height so the section headings can pin directly
  // below it — `MENU_PINNED_BLOCK_HEIGHT_VAR` explains why an offset is needed at
  // all. Re-runs on `loading` because neither node exists while the spinner is up.
  useEffect(() => {
    // Nothing is rendered but the spinner while loading, so there is no block to
    // measure yet. Checked directly rather than leaning on the refs being null,
    // which reads as an unused dependency.
    if (loading) return undefined

    const root = rootRef.current
    const pinned = pinnedRef.current
    if (!root || !pinned) return undefined

    const publish = () =>
      root.style.setProperty(MENU_PINNED_BLOCK_HEIGHT_VAR, `${pinned.offsetHeight}px`)

    publish()

    // The block changes height in use: the Drafts row is conditional on the
    // workspace, and the filter input can wrap.
    const observer = new ResizeObserver(publish)
    observer.observe(pinned)
    return () => observer.disconnect()
  }, [loading])

  if (loading) {
    return (
      <Flex padding={4} justifyContent="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Card radius={3} ref={rootRef}>
      {/* Only the filter is pinned. Published and drafts used to be pinned with it, which made the
          panel a fixed top, a scrolling middle and a fixed bottom — and hid the fact that these two
          are the first entries in the same time order as the releases below: published is live now,
          drafts is the indefinite next, then asap, then dated, then undecided. */}
      <StickyTopCard borderBottom ref={pinnedRef}>
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
      </StickyTopCard>
      <Card borderBottom padding={1}>
        <Stack gap={1}>
          <GlobalPerspectiveMenuItem release={'published'} menuItemProps={menuItemProps} />
          {isDraftModelEnabled && (
            <GlobalPerspectiveMenuItem release={LATEST} menuItemProps={menuItemProps} />
          )}
        </Stack>
      </Card>
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
            />
          ) : (
            <ReleaseTypeSections releases={filteredReleases} menuItemProps={menuItemProps} />
          )}
        </Stack>
      )}
      {/* The card carries the border, so it must not render when every item inside it is hidden:
          releases off and scheduled drafts unavailable leaves a divider with nothing under it. */}
      {(areReleasesEnabled || isScheduledDraftsAvailable) && (
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
