import {ObjectInputProps} from 'sanity'
import {Stack, Flex, Spinner, Text} from '@sanity/ui'
import React, {lazy, Suspense} from 'react'
import styled from 'styled-components'

const TorusKnotInputPreview = lazy(() => import('./TorusKnotInputPreview'))

const SquareFlex = styled(Flex)`
  aspect-ratio: 1/1;
  background: var(--card-skeleton-color-from);
`

const Loading = (
  <SquareFlex
    align="center"
    direction="column"
    gap={4}
    justify="center"
    padding={6}
    sizing="border"
  >
    <Text muted>Loading…</Text>
    <Spinner muted />
  </SquareFlex>
)

export default function TorusKnotInputComponent(props: ObjectInputProps) {
  const {value, renderDefault} = props
  return (
    <Stack space={2}>
      <Suspense fallback={Loading}>
        {value ? <TorusKnotInputPreview {...(value as any)} /> : Loading}
      </Suspense>
      {renderDefault(props)}
    </Stack>
  )
}
