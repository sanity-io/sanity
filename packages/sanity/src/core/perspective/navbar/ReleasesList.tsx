import {type ReleaseDocument, type ReleaseType} from '@sanity/client'
import {Card, Flex, Spinner, Stack} from '@sanity/ui'
import {type JSX, useMemo} from 'react'
import {styled} from 'styled-components'

import {CreateReleaseMenuItem} from '../../releases/components/CreateReleaseMenuItem'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {LATEST} from '../../releases/util/const'
import {useAgentBundles} from '../../store/agent/useAgentBundles'
import {useWorkspace} from '../../studio/workspace'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {AgentBundleMenuItem} from './AgentBundleMenuItem'
import {GlobalPerspectiveMenuItem} from './GlobalPerspectiveMenuItem'
import {ReleaseTypeMenuSection} from './ReleaseTypeMenuSection'
import {ScheduledDraftsMenuItem} from './ScheduledDraftsMenuItem'
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

export function ReleasesList({
  areReleasesEnabled,
  handleOpenBundleDialog,
  menuItemProps,
}: {
  areReleasesEnabled: boolean
  handleOpenBundleDialog: () => void
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): JSX.Element {
  const {loading, data: allReleases} = useActiveReleases()
  const {bundles: agentBundles} = useAgentBundles()

  const releases = useMemo(
    () => allReleases.filter((release) => !isCardinalityOneRelease(release)),
    [allReleases],
  )

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const sortedReleaseTypeReleases = useMemo(
    () =>
      orderedReleaseTypes.reduce<Record<ReleaseType, ReleaseDocument[]>>(
        (ReleaseTypeReleases, releaseType) => ({
          ...ReleaseTypeReleases,
          [releaseType]: releases.filter(({metadata}) => metadata.releaseType === releaseType),
        }),
        {} as Record<ReleaseType, ReleaseDocument[]>,
      ),
    [releases],
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
      <StickyTopCard borderBottom padding={1}>
        <Stack gap={1}>
          <GlobalPerspectiveMenuItem release={'published'} menuItemProps={menuItemProps} />
          {isDraftModelEnabled && (
            <GlobalPerspectiveMenuItem release={LATEST} menuItemProps={menuItemProps} />
          )}
        </Stack>
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
          {orderedReleaseTypes.map((releaseType) => (
            <ReleaseTypeMenuSection
              key={releaseType}
              releaseType={releaseType}
              releases={sortedReleaseTypeReleases[releaseType]}
              menuItemProps={menuItemProps}
            />
          ))}
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
