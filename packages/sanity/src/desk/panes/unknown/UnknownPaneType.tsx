import {Box, Text} from '@sanity/ui'
import React from 'react'
import {isRecord} from '../../../core'
import {Pane, PaneContent, PaneHeader} from '../../components/pane'

interface UnknownPaneProps {
  isSelected: boolean
  pane: unknown
  paneKey: string
}

/**
 * @internal
 */
export function UnknownPane(props: UnknownPaneProps) {
  const {isSelected, pane, paneKey} = props
  const type = (isRecord(pane) && pane.type) || null

  return (
    <Pane id={paneKey} selected={isSelected}>
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
