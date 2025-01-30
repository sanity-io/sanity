import {LockIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import {
  formatRelativeLocalePublishDate,
  getReleaseTone,
  LATEST,
  type ReleaseDocument,
  Translate,
  useTranslation,
} from 'sanity'

import {Banner} from './Banner'

export function ScheduledReleaseBanner({
  currentRelease,
}: {
  currentRelease: ReleaseDocument
}): React.JSX.Element {
  const tone = getReleaseTone(currentRelease ?? LATEST)

  const {t: tCore} = useTranslation()

  return (
    <Banner
      tone={tone}
      paddingY={0}
      content={
        <Flex align="center" justify="space-between" gap={1} flex={1}>
          <Text size={1}>
            <Flex align="center" justify="center" gap={2}>
              <LockIcon />{' '}
              <Translate
                t={tCore}
                i18nKey="release.banner.scheduled-for-publishing-on"
                values={{
                  date: formatRelativeLocalePublishDate(currentRelease),
                }}
              />
            </Flex>
          </Text>
        </Flex>
      }
    />
  )
}
