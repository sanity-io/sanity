import React, {lazy, memo, Suspense} from 'react'
import {Skeleton, Stack, TextSkeleton} from '@sanity/ui'

const TorusKnotPreview = lazy(() => import('./TorusKnotPreview'))

export const LazyPreviewMedia = memo(function LazyPreviewMedia(
  props: React.ComponentProps<typeof TorusKnotPreview>,
) {
  return (
    <Suspense fallback={<Skeleton padding={4} radius={1} animated />}>
      <TorusKnotPreview {...props} />
    </Suspense>
  )
})

const ColorInput = lazy(() => import('./ColorInput'))

export const LazyColorInput = memo(function LazyColorInput(
  props: React.ComponentProps<typeof ColorInput>,
) {
  return (
    <Suspense
      fallback={
        <Stack space={2}>
          <Skeleton
            sizing="border"
            style={{borderRadius: '2px', width: '6ch', height: '1.6rem'}}
            animated
          />
          <TextSkeleton style={{width: '3ch'}} size={0} muted radius={1} animated />
        </Stack>
      }
    >
      <ColorInput {...props} />
    </Suspense>
  )
})
