import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {mediaLibraryUsEnglishLocaleBundle} from '../../i18n'
import {VideoSkeleton} from '../VideoSkeleton'

const NOOP = () => undefined
const LOAD_ERROR = new Error('Video failed to load')

/**
 * Chromatic sentinel for the video-input error chrome after the ui5 Flex
 * migration: critical RatioBox, centered copy, optional retry. The
 * animated Skeleton loading path is omitted (would churn). Media-library
 * i18n only; no video assets.
 */
export function VideoSkeletonStory() {
  return (
    <TestWrapper i18nBundles={[mediaLibraryUsEnglishLocaleBundle]} schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              error, no retry
            </Text>
            <VideoSkeleton error={LOAD_ERROR} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              error with retry
            </Text>
            <VideoSkeleton error={LOAD_ERROR} retry={NOOP} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              portrait error
            </Text>
            <VideoSkeleton aspectRatio={9 / 16} error={LOAD_ERROR} retry={NOOP} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
