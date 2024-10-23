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
import {type ReleaseDocument} from '../../../store'
import {releasesLocaleNamespace} from '../../i18n'
import {type ReleaseInspector} from './ReleaseDetail'

export function ReleaseDashboardHeader(props: {
  inspector: ReleaseInspector | undefined
  release: ReleaseDocument
  setInspector: Dispatch<SetStateAction<ReleaseInspector | undefined>>
}) {
  const {inspector, release, setInspector} = props
  const title = release.metadata.title
  const {t} = useTranslation(releasesLocaleNamespace)
  const router = useRouter()
  const handleNavigateToReleasesList = useCallback(() => {
    router.navigate({})
  }, [router])

  const handleActivityClick = useCallback(() => {
    setInspector((prev) => (prev === 'activity' ? undefined : 'activity'))
  }, [setInspector])

  const handleTitleClick = useCallback(() => {
    // TODO: Focus on the title when clicked once it's editable
  }, [])

  return (
    <Flex align="flex-start">
      <Flex flex={1} gap={1}>
        <Breadcrumbs
          gap={0}
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
          />
          <Button
            mode="bleed"
            onClick={handleTitleClick}
            text={title}
            textWeight="semibold"
            padding={2}
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
