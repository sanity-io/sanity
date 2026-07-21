import {type ReleaseDocument} from '@sanity/client'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {RestoreIcon} from '@sanity/icons/Restore'
import {
  Box,
  // oxlint-disable-next-line no-restricted-imports
  Button, // Custom button with a different textWeight, consider adding textWeight to the shared
  Container,
  Flex,
  Text,
} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {DetailBackButton} from '../../../components/detailLayout'
import {useTranslation} from '../../../i18n'
import {useWorkspace} from '../../../studio/workspace'
import {releasesLocaleNamespace} from '../../i18n'
import {GROUP_SEARCH_PARAM_KEY} from '../overview/queryParamUtils'
import {CopyReleaseActions} from './CopyReleaseActions'
import {ReleaseActionRail} from './ReleaseActionRail'
import {type ReleaseInspector} from './ReleaseDetail'
import {type DocumentInRelease} from './types'

// The bleed back-button carries its own horizontal padding, which would push the breadcrumb text
// right of the title/table left edge. Cancel that padding so the breadcrumb sits on the same hard
// left line as everything below it, framing the pane.
const BREADCRUMB_ALIGN_STYLE = {marginLeft: -8}

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

  return (
    // Share the same width={3} gutter as the details/table panes below, so the breadcrumb aligns
    // with the title and the Share/Activity actions align flush with the metadata rail's right edge.
    <Container width={3}>
      <Box padding={3}>
        <Flex align="flex-start">
          <Flex flex={1} align="center" style={{minWidth: 0}}>
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
                <Flex flex="none">
                  <Button
                    mode="bleed"
                    onClick={handleNavigateToReleasesList}
                    text={t('overview.title')}
                    textWeight="regular"
                    padding={2}
                    style={BREADCRUMB_ALIGN_STYLE}
                    data-testid="back-to-releases-button"
                  />
                </Flex>
                <Box paddingY={2} flex="none">
                  <Text size={1}>
                    <ChevronRightIcon />
                  </Text>
                </Box>
                <Box padding={2} style={{minWidth: 0, maxWidth: '300px'}}>
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
            // of in a bottom footer. The footer is dropped in beta (see ReleaseDetail).
            <Flex flex="none">
              <ReleaseActionRail release={release} documents={documents} />
            </Flex>
          ) : (
            <Flex flex="none" gap={2}>
              <CopyReleaseActions release={release} />
              <Button
                icon={RestoreIcon}
                mode="bleed"
                onClick={handleActivityClick}
                padding={2}
                selected={inspector === 'activity'}
                space={2}
                text={t('dashboard.details.activity')}
              />
            </Flex>
          )}
        </Flex>
      </Box>
    </Container>
  )
}
