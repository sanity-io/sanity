import {Skeleton, Stack, TextSkeleton} from '@sanity/ui'
import {type ComponentProps, lazy, memo, Suspense} from 'react'

const TorusKnotPreview = lazy(() => import('./TorusKnotPreview'))

export const LazyPreviewMedia = memo(function LazyPreviewMedia(
  props: ComponentProps<typeof TorusKnotPreview>,
) {
  return (
    <Suspense fallback={<Skeleton padding={4} radius={1} animated />}>
      <TorusKnotPreview {...props} />
    </Suspense>
  )
})

const ColorInput = lazy(() => import('./ColorInput'))

export const LazyColorInput = memo(function LazyColorInput(
  props: ComponentProps<typeof ColorInput>,
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
