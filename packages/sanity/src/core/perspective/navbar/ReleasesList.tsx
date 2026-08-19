import {Card, Flex, Spinner, Stack, TextInput} from '@sanity/ui'
import {type ChangeEvent, type JSX, useCallback, useMemo} from 'react'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {CreateReleaseMenuItem} from '../../releases/components/CreateReleaseMenuItem'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST} from '../../releases/util/const'
import {filterReleasesForSearch} from '../../releases/util/filterReleasesForSearch'
import {useAgentBundles} from '../../store/agent/useAgentBundles'
import {useWorkspace} from '../../studio/workspace'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {usePerspectiveActiveDocument} from '../activeDocument/usePerspectiveActiveDocument'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {AgentBundleMenuItem} from './AgentBundleMenuItem'
import {GlobalPerspectiveMenuItem} from './GlobalPerspectiveMenuItem'
import {DocumentReleaseSections, ReleaseTypeSections} from './ReleaseMenuSections'
import {ScheduledDraftsMenuItem} from './ScheduledDraftsMenuItem'
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
  const {loading, data: allReleases} = useActiveReleases()
  const {bundles: agentBundles} = useAgentBundles()
  const {activeDocument} = usePerspectiveActiveDocument()

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

  if (loading) {
    return (
      <Flex padding={4} justify="center" data-testid="spinner">
        <Spinner muted />
      </Flex>
    )
  }

  return (
    <Card radius={3}>
      <StickyTopCard borderBottom>
        <Card padding={2} borderBottom>
          <TextInput
            data-testid="release-menu-filter"
            fontSize={1}
            onChange={handleFilterChange}
            placeholder={t('release.menu.filter-placeholder')}
            radius={2}
            value={filterQuery}
          />
        </Card>
        <Box padding={1}>
          <Stack gap={1}>
            <GlobalPerspectiveMenuItem release={'published'} menuItemProps={menuItemProps} />
            {isDraftModelEnabled && (
              <GlobalPerspectiveMenuItem release={LATEST} menuItemProps={menuItemProps} />
            )}
          </Stack>
        </Box>
      </StickyTopCard>
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
      <StickyBottomCard borderTop paddingY={1} paddingX={2}>
        <Stack gap={1}>
          <ScheduledDraftsMenuItem />
          {areReleasesEnabled && (
            <>
              <ViewContentReleasesMenuItem />
              <CreateReleaseMenuItem onCreateRelease={handleOpenBundleDialog} />
            </>
          )}
        </Stack>
      </StickyBottomCard>
    </Card>
  )
}
