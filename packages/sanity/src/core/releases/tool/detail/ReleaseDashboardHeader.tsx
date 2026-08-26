import {type ReleaseDocument} from '@sanity/client'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {RestoreIcon} from '@sanity/icons/Restore'
import {
  // oxlint-disable-next-line no-restricted-imports
  Button, // Custom button with a different textWeight, consider adding textWeight to the shared
  Container,
  Text,
} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useCallback} from 'react'
import {useRouter} from 'sanity/router'
import {Box, Flex} from 'ui5'

import {DetailBackButton} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../studio/workspace'
import {releasesLocaleNamespace} from '../../i18n'
import {GROUP_SEARCH_PARAM_KEY} from '../overview/queryParamUtils'
import {CopyReleaseActions} from './CopyReleaseActions'
import {ReleaseActionRail} from './ReleaseActionRail'
import {type ReleaseInspector} from './ReleaseDetail'
import {type DocumentInRelease} from './types'

export function ReleaseDashboardHeader(props: {
  documents: DocumentInRelease[]
  inspector: ReleaseInspector | undefined
  release: ReleaseDocument
  setInspector: Dispatch<SetStateAction<ReleaseInspector | undefined>>
}) {
  const {documents, inspector, release, setInspector} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const title = release.metadata.title || tCore('release.placeholder-untitled-release')
  const router = useRouter()

  // Behind beta.variants the Share/Activity actions move into the table's command lane (one action
  // lane). Production keeps them in the header until the flag flips.
  const {beta} = useWorkspace()
  const variantsEnabled = Boolean(beta?.variants?.enabled)

  const handleNavigateToReleasesList = useCallback(() => {
    const isReleaseOpen = release.state !== 'archived' && release.state !== 'published'

    router.navigate({
      _searchParams: isReleaseOpen ? undefined : [[GROUP_SEARCH_PARAM_KEY, 'archived']],
    })
  }, [release.state, router])

  const handleActivityClick = useCallback(() => {
    setInspector((prev) => (prev === 'activity' ? undefined : 'activity'))
  }, [setInspector])

  const headerContent = (
    <Box padding={3}>
      <Flex alignItems="flex-start">
        <Flex flexBasis="0%" flexGrow={1} alignItems="center">
          {variantsEnabled ? (
            // A single back affordance — the release title already headlines the pane below, so
            // the breadcrumb's repeat of it is dropped. Mirrors the Variants detail's back arrow.
            <DetailBackButton
              text={t('overview.back-to-all-releases')}
              onClick={handleNavigateToReleasesList}
              testId="back-to-releases-button"
            />
          ) : (
            <>
              <Flex flexBasis="auto" flexGrow={0} flexShrink={0}>
                <Button
                  mode="bleed"
                  onClick={handleNavigateToReleasesList}
                  text={t('overview.title')}
                  textWeight="regular"
                  padding={2}
                  data-testid="back-to-releases-button"
                />
              </Flex>
              <Box paddingY={2} flexBasis="auto" flexGrow={0} flexShrink={0}>
                <Text size={1}>
                  <ChevronRightIcon />
                </Text>
              </Box>
              <Box padding={2} style={{maxWidth: '300px'}}>
                <Text
                  size={1}
                  weight="semibold"
                  textOverflow="ellipsis"
                  style={release.metadata.title ? undefined : {opacity: 0.5}}
                >
                  {title}
                </Text>
              </Box>
            </>
          )}
        </Flex>

        {variantsEnabled ? (
          // The F-pattern action rail: the release's primary action (Run release / Publish /
          // Schedule / …) and its overflow menu sit top-right, where the eye lands first, instead
          // of in a bottom footer. The footer is dropped in beta (see ReleaseDetail). Copy + Activity
          // sit alongside it here rather than in the table's command lane: the header always renders,
          // so they stay reachable even when the table is loading, errored, or an empty
          // cardinality-one release (where the command lane is not mounted).
          <Flex flexBasis="auto" flexGrow={0} flexShrink={0} gap={2} alignItems="center">
            <CopyReleaseActions release={release} />
            <Button
              data-testid="activity-button"
              icon={RestoreIcon}
              mode="bleed"
              onClick={handleActivityClick}
              padding={2}
              selected={inspector === 'activity'}
              gap={2}
              text={t('dashboard.details.activity')}
            />
            <ReleaseActionRail release={release} documents={documents} />
          </Flex>
        ) : (
          <Flex flexBasis="auto" flexGrow={0} flexShrink={0} gap={2}>
            <CopyReleaseActions release={release} />
            <Button
              icon={RestoreIcon}
              mode="bleed"
              onClick={handleActivityClick}
              padding={2}
              selected={inspector === 'activity'}
              gap={2}
              text={t('dashboard.details.activity')}
            />
          </Flex>
        )}
      </Flex>
    </Box>
  )

  // Only the beta layout constrains the header to the width={3} gutter shared with the new
  // details/table panes below. With variants off the details and table stay on the old full-bleed
  // path, so the header must too — otherwise a centered/constrained header sits over a full-width
  // table, the hybrid layout flagged in review. Production padding is preserved by the inner Box
  // (on main the parent Card supplied padding={3}; the redesign moved it here).
  return variantsEnabled ? <Container width={3}>{headerContent}</Container> : headerContent
}
