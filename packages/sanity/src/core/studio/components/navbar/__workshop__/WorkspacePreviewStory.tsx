import React, {CSSProperties} from 'react'
import {IceCreamIcon} from '@sanity/icons'
import {Card, Flex} from '@sanity/ui'
import {useBoolean, useSelect, useString} from '@sanity/ui-workshop'
import {WorkspacePreview} from '../workspace'

const CARD_INLINE_STYLE: CSSProperties = {
  width: 250,
}

const STATE_OPTIONS: Record<string, 'logged-in' | 'logged-out' | 'no-access'> = {
  'logged-in': 'logged-in',
  'logged-out': 'logged-out',
  'no-access': 'no-access',
}

export default function WorkspacePreviewStory() {
  const title = useString('Title', 'Title') || ''
  const subtitle = useString('Subtitle', 'Subtitle') || ''
  const state = useSelect('State', STATE_OPTIONS, 'logged-in') || 'logged-in'
  const selected = useBoolean('Selected', false) || false

  return (
    <Flex align="center" height="fill" justify="center">
      <Card style={CARD_INLINE_STYLE}>
        <WorkspacePreview
          icon={IceCreamIcon}
          selected={selected}
          state={state}
          subtitle={subtitle}
          title={title}
        />
      </Card>
    </Flex>
  )
}
