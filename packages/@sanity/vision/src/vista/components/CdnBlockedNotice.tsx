import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import {Button, Card, Stack} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {Text, Flex} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'

export interface CdnBlockedNoticeProps {
  testId: string
  /** The tab's perspective as the perspective select names it */
  perspectiveName: string
  /** Switches the tab to the published perspective, which the API CDN serves */
  onUsePublished?: () => void
}

/** Says that the API CDN is asked for but not used, because of the tab's perspective */
export function CdnBlockedNotice({testId, perspectiveName, onUsePublished}: CdnBlockedNoticeProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <Card border data-testid={testId} padding={3} radius={2} tone="caution">
      <Flex gap={3}>
        <Text size={1} as="div" trim={true}>
          <WarningOutlineIcon />
        </Text>
        <Stack flex={1} gap={3}>
          <Text size={1} weight="medium" as="div" trim={true}>
            {t('vista.options.use-cdn.blocked.title')}
          </Text>
          <Text size={1} as="div" trim={true}>
            {t('vista.options.use-cdn.blocked', {perspective: perspectiveName})}
          </Text>
          {onUsePublished && (
            <Flex>
              <Button
                data-testid={`${testId}-use-published`}
                fontSize={1}
                mode="ghost"
                onClick={onUsePublished}
                padding={2}
                text={t('vista.options.use-cdn.use-published')}
              />
            </Flex>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}
