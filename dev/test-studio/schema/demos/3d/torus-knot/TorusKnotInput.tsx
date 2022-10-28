import {ObjectInputProps} from 'sanity'
import {Stack, Skeleton} from '@sanity/ui'
import React, {lazy, Suspense} from 'react'
import styled from 'styled-components'

const TorusKnotInputPreview = lazy(() => import('./TorusKnotInputPreview'))

const SquareSkeleton = styled(Skeleton)`
  aspect-ratio: 1/1;
  width: 100%;
`

const fallback = <SquareSkeleton animated />

export default function TorusKnotInputComponent(props: ObjectInputProps) {
  const {value, renderDefault} = props
  return (
    <Stack space={2}>
      <Suspense fallback={fallback}>
        {value ? <TorusKnotInputPreview {...(value as any)} /> : fallback}
      </Suspense>
      {renderDefault(props)}
    </Stack>
  )
}
