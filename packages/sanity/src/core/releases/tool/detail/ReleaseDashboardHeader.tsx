import {ChevronRightIcon, RestoreIcon} from '@sanity/icons'
import {
  Box,
  Breadcrumbs,
  // eslint-disable-next-line no-restricted-imports
  Button, // Custom button with a different textWeight, consider adding textWeight to the shared
  Flex,
  Text,
} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseDocument} from '../../index'
import {GROUP_SEARCH_PARAM_KEY} from '../overview/queryParamUtils'
import {type ReleaseInspector} from './ReleaseDetail'

export function ReleaseDashboardHeader(props: {
  inspector: ReleaseInspector | undefined
  release: ReleaseDocument
  setInspector: Dispatch<SetStateAction<ReleaseInspector | undefined>>
}) {
  const {inspector, release, setInspector} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const {t: tCore} = useTranslation()
  const title = release.metadata.title || tCore('release.placeholder-untitled-release')
  const router = useRouter()

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
    <Flex align="flex-start">
      <Flex flex={1} gap={1}>
        <Breadcrumbs
          space={0}
          separator={
            <Box paddingY={2}>
              <Text size={1}>
                <ChevronRightIcon />
              </Text>
            </Box>
          }
        >
          <Button
            mode="bleed"
            onClick={handleNavigateToReleasesList}
            text={t('overview.title')}
            textWeight="regular"
            padding={2}
            data-testid="back-to-releases-button"
          />
          <Button
            mode="bleed"
            text={title || tCore('release.placeholder-untitled-release')}
            textWeight="semibold"
            padding={2}
            style={title ? undefined : {opacity: 0.5}}
          />
        </Breadcrumbs>
      </Flex>

      <Flex flex="none" gap={2}>
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
    </Flex>
  )
}
