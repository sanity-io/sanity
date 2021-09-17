import React from 'react'
import {Box, CardTone} from '@sanity/ui'
import {Pane, PaneContent, PaneHeader} from '../../components/pane'

/**
 * @internal
 */
export function ErrorPane(props: {
  children?: React.ReactNode
  flex?: number
  minWidth?: number
  title?: React.ReactNode
  tone?: CardTone
}) {
  const {children, flex, minWidth, title = 'Error', tone = 'critical'} = props

  return (
    <Pane flex={flex} minWidth={minWidth} tone={tone}>
      <PaneHeader title={title} />
      <PaneContent overflow="auto">
        <Box paddingX={4} paddingY={5}>
          {children}
        </Box>
      </PaneContent>
    </Pane>
  )
}
