import React from 'react'
import {Box, Text} from '@sanity/ui'
import {Pane, PaneContent, PaneHeader} from '../../components/pane'

const isRecord = (thing: unknown): thing is Record<string, unknown> =>
  !!thing && typeof thing === 'object' && !Array.isArray(thing)

interface UnknownPaneProps {
  index: number
  isSelected: boolean
  pane: unknown
}

/**
 * @internal
 */
export function UnknownPane(props: UnknownPaneProps) {
  const {index, isSelected, pane} = props
  const type = (isRecord(pane) && pane.type) || null

  return (
    <Pane data-index={index} selected={isSelected}>
      <PaneHeader title="Unknown pane type" />
      <PaneContent>
        <Box padding={4}>
          {typeof type === 'string' ? (
            <Text as="p" muted>
              Structure item of type <code>{type}</code> is not a known entity.
            </Text>
          ) : (
            <Text as="p" muted>
              Structure item is missing required <code>type</code> property.
            </Text>
          )}
        </Box>
      </PaneContent>
    </Pane>
  )
}
