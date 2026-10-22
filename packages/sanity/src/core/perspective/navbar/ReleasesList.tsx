import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {type JSX, type RefObject, useLayoutEffect, useMemo, useRef} from 'react'
import {styled} from 'styled-components'
import {Flex} from 'ui5'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {CreateReleaseMenuItem} from '../../releases/components/CreateReleaseMenuItem'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST, PUBLISHED} from '../../releases/util/const'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useAgentBundles} from '../../store/agent/useAgentBundles'
import {useWorkspace} from '../../studio/workspace'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {AgentBundleMenuItem} from './AgentBundleMenuItem'
import {
  getRangePosition,
  GlobalPerspectiveMenuItem,
  type LayerRange,
} from './GlobalPerspectiveMenuItem'
import {usePerspectiveMenuExtension} from './PerspectiveMenuExtension'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'
import {ScheduledDraftsMenuItem} from './ScheduledDraftsMenuItem'
import {useReleaseMenuSearch} from './useReleaseMenuSearch'
import {type ScrollElement} from './useScrollIndicatorVisibility'
import {ViewContentReleasesMenuItem} from './ViewContentReleasesMenuItem'

const orderedReleaseTypes: ReleaseType[] = ['asap', 'scheduled', 'undecided']

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

/**
 * PROPOSED: how many entries (versions, releases) the menu shows before its list scrolls. The navbar's other menus (the Variants menu) show
 * the same number, so the two read as one family: the same count of rows, not the same pixels (release rows are taller).
 */
export const RELEASE_MENU_VISIBLE_ROWS = 10

const ROW = "[data-ui='MenuItem']"

export function ReleasesList({
  areReleasesEnabled,
  setScrollContainer,
  isRangeVisible,
  selectedPerspectiveName,
  handleOpenBundleDialog,
  scrollElementRef,
  menuItemProps,
}: {
  areReleasesEnabled: boolean
  setScrollContainer: (el: HTMLElement | null) => void
  isRangeVisible: boolean
  selectedPerspectiveName: string | undefined
  handleOpenBundleDialog: () => void
  scrollElementRef: RefObject<ScrollElement>
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): JSX.Element {
  const {loading, data: allReleases} = useActiveReleases()
  const extension = usePerspectiveMenuExtension()
  const {bundles: agentBundles} = useAgentBundles()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const {t} = useTranslation()
  // PROPOSED: the menu always has a search field at the top (a host may still set its own words and threshold).
  const search = extension?.search ?? {
    above: 0,
    placeholder: t('release.menu.search.placeholder'),
    empty: (text: string) => t('release.menu.search.empty', {query: text}),
  }
  const allEntries = useMemo(
    () => allReleases.filter((release) => !isCardinalityOneRelease(release)),
    [allReleases],
  )
  const entryCount =
    1 + (isDraftModelEnabled ? 1 : 0) + (areReleasesEnabled ? allEntries.length : 0)
  const menuRef = useRef<HTMLDivElement | null>(null)
  // PROPOSED: the list between the search and the actions scrolls once it holds more than RELEASE_MENU_VISIBLE_ROWS entries. Its height is
  // measured from the rows it holds, so a release row with a date takes the room it needs and the count stays the same.
  const listRef = useRef<HTMLDivElement | null>(null)
  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    const rows = list.querySelectorAll<HTMLElement>(ROW)
    const last = rows[RELEASE_MENU_VISIBLE_ROWS - 1]
    if (rows.length <= RELEASE_MENU_VISIBLE_ROWS || !last) {
      list.style.maxHeight = ''
      return
    }
    const top = list.getBoundingClientRect().top - list.scrollTop
    list.style.maxHeight = `${Math.ceil(last.getBoundingClientRect().bottom - top) + 4}px`
  })
  const {searchable, query, needle, size, setQuery} = useReleaseMenuSearch(
    search,
    entryCount,
    selectedPerspectiveName,
  )
  const matchesQuery = (label: string) => !needle || label.toLowerCase().includes(needle)

  const sortedReleaseTypeReleases = useMemo(() => {
    const visible = allEntries.filter(
      (release) =>
        !needle || (release.metadata.title || release._id).toLowerCase().includes(needle),
    )
    return orderedReleaseTypes.reduce<Record<ReleaseType, ReleaseDocument[]>>(
      (ReleaseTypeReleases, releaseType) => ({
        ...ReleaseTypeReleases,
        [releaseType]: visible.filter(({metadata}) => metadata.releaseType === releaseType),
      }),
      {} as Record<ReleaseType, ReleaseDocument[]>,
    )
  }, [allEntries, needle])

  const range: LayerRange = useMemo(() => {
    const isDraftsPerspective = typeof selectedPerspectiveName === 'undefined'
    let lastIndex = isDraftsPerspective ? 1 : 0

    const systemStack = [PUBLISHED, isDraftModelEnabled ? LATEST : []].flat()
    const {asap, scheduled} = sortedReleaseTypeReleases

    const offsets = {
      asap: systemStack.length,
      scheduled: systemStack.length + asap.length,
      undecided: systemStack.length + asap.length + scheduled.length,
    }

    const adjustIndexForReleaseType = (type: ReleaseType) => {
      const groupSubsetReleases = sortedReleaseTypeReleases[type]
      const offset = offsets[type]

      groupSubsetReleases.forEach((release, groupReleaseIndex) => {
        const index = offset + groupReleaseIndex

        if (selectedPerspectiveName === getReleaseIdFromReleaseDocumentId(release._id)) {
          lastIndex = index
        }
      })
    }

    orderedReleaseTypes.forEach(adjustIndexForReleaseType)

    return {
      lastIndex,
      offsets,
    }
  }, [isDraftModelEnabled, selectedPerspectiveName, sortedReleaseTypeReleases])

  if (loading) {
    return (
      <Flex padding={4} justifyContent="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  const showPublished = matchesQuery('published')
  const showDrafts = isDraftModelEnabled && matchesQuery('drafts')
  const hasVisibleReleases = orderedReleaseTypes.some(
    (releaseType) => sortedReleaseTypeReleases[releaseType].length > 0,
  )
  const nothingMatches = Boolean(needle) && !showPublished && !showDrafts && !hasVisibleReleases

  return (
    <Card radius={3} ref={menuRef} style={size ? {width: size.width} : undefined}>
      {searchable && search && (
        <StickyTopCard borderBottom padding={2}>
          <TextInput
            autoFocus
            data-testid="release-menu-search"
            fontSize={1}
            icon={SearchIcon}
            onChange={(event) => setQuery(event.currentTarget.value, menuRef.current)}
            placeholder={search.placeholder}
            value={query}
          />
        </StickyTopCard>
      )}
      {/* PROPOSED: one scrolling list in the middle: Published, Drafts and the releases (as in the Variants menu). */}
      <div data-testid="release-menu-list" ref={listRef} style={{overflowY: 'auto'}}>
        <Card padding={1} borderBottom>
          <Stack gap={1}>
            {showPublished && (
              <GlobalPerspectiveMenuItem
                rangePosition={isRangeVisible && !needle ? getRangePosition(range, 0) : undefined}
                release={'published'}
                menuItemProps={menuItemProps}
              />
            )}
            {showDrafts && (
              <GlobalPerspectiveMenuItem
                rangePosition={isRangeVisible && !needle ? getRangePosition(range, 1) : undefined}
                release={LATEST}
                menuItemProps={menuItemProps}
              />
            )}
            {nothingMatches && search && (
              <Box data-testid="release-menu-search-empty" padding={3}>
                <Text muted size={1}>
                  {search.empty(query)}
                </Text>
              </Box>
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
          <Stack ref={setScrollContainer} data-ui="scroll-wrapper">
            {orderedReleaseTypes.map((releaseType) => (
              <ReleaseTypeMenuSection
                key={releaseType}
                releaseType={releaseType}
                releases={sortedReleaseTypeReleases[releaseType]}
                range={needle ? {...range, lastIndex: -1} : range}
                currentGlobalBundleMenuItemRef={scrollElementRef}
                menuItemProps={menuItemProps}
              />
            ))}
          </Stack>
        )}
      </div>
      {/* While searching, only the entries show: the footer actions are not results. */}
      {!needle && (
        <StickyBottomCard borderTop paddingY={1} paddingX={2}>
          <Stack gap={1}>
            {/* PROPOSED: a host's extra rows lead the bottom group, above View Scheduled Drafts (also with releases off). */}
            {extension?.extraRows}
            <ScheduledDraftsMenuItem />
            {areReleasesEnabled && (
              <>
                <ViewContentReleasesMenuItem />
                <CreateReleaseMenuItem onCreateRelease={handleOpenBundleDialog} />
              </>
            )}
          </Stack>
        </StickyBottomCard>
      )}
    </Card>
  )
}
