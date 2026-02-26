import {ResetIcon} from '@sanity/icons'
import {Card, Flex, Skeleton, Stack, Text, TextSkeleton} from '@sanity/ui'

import {useTranslation} from '../../../core/i18n'
import {Button} from '../../../ui-components/button'

interface VideoSkeletonProps {
  error?: Error
  retry?: () => void
}

export function VideoSkeleton({error, retry}: VideoSkeletonProps) {
  const {t} = useTranslation()

  return (
    <Card padding={0} radius={0} tone={error ? 'critical' : 'default'}>
      <Flex align="center" justify="flex-start" padding={2}>
        <Skeleton padding={3} radius={1} animated={!error} />
        <Stack flex={1} space={2} marginLeft={3}>
          <TextSkeleton style={{width: '100%'}} radius={1} animated={!error} />
          <TextSkeleton style={{width: '100%'}} radius={1} animated={!error} />
        </Stack>
      </Flex>
      {error && (
        <Stack space={3} padding={3} paddingTop={0}>
          <Text size={1} muted>
            {error.message || t('inputs.file.video-error.description')}
          </Text>
          {retry && (
            <Button
              icon={ResetIcon}
              mode="ghost"
              text={t('inputs.file.video-error.retry-button.text')}
              onClick={retry}
            />
          )}
        </Stack>
      )}
    </Card>
  )
}
