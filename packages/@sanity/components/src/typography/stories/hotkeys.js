import {select, text} from 'part:@sanity/storybook/addons/knobs'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'
import Hotkeys from '../Hotkeys'

export function HotkeysStory() {
  const keys = text('Keys (array)', 'Ctrl Alt T', 'props')

  return (
    <CenteredContainer>
      <Hotkeys
        keys={keys.split(' ')}
        size={select('Size', ['large', 'medium', 'small'], undefined, 'props')}
      />
    </CenteredContainer>
  )
}
