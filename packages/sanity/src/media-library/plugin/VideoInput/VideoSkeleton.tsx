import {ResetIcon} from '@sanity/icons'
import {Flex, Skeleton, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'

import {useTranslation} from '../../../core/i18n/hooks/useTranslation'
import {Button} from '../../../ui-components/button/Button'
import {mediaLibraryLocaleNamespace} from '../i18n'
import {RatioBox} from './styles'

interface VideoSkeletonProps {
  error?: Error
  retry?: () => void
  aspectRatio?: number
}

export function VideoSkeleton({error, retry, aspectRatio}: VideoSkeletonProps) {
  const {t} = useTranslation(mediaLibraryLocaleNamespace)
  const ratio = aspectRatio ?? 16 / 9

  return (
    <RatioBox
      tone={error ? 'critical' : 'transparent'}
      $isPortrait={ratio < 0.75}
      style={{'--aspect-ratio': ratio} as CSSProperties}
    >
      {error ? (
        <Flex
          align="center"
          justify="center"
          direction="column"
          gap={3}
          style={{position: 'absolute', inset: 0}}
          padding={4}
        >
          <Text size={1} muted>
            {error.message || t('video-error.description')}
          </Text>
          {retry && (
            <Button
              icon={ResetIcon}
              mode="ghost"
              text={t('video-error.retry-button.text')}
              onClick={retry}
            />
          )}
        </Flex>
      ) : (
        <Skeleton style={{position: 'absolute', inset: 0}} radius={1} animated />
      )}
    </RatioBox>
  )
}
