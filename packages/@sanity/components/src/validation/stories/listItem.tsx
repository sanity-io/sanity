import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, text} from 'part:@sanity/storybook/addons/knobs'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'
import ValidationListItem from '../ValidationListItem'
import {Marker} from '../../types'

export function ListItemStory() {
  const marker: Marker = {
    type: 'validation',
    level: 'error',
    path: ['test'],
    item: {
      message: text(
        'Message',
        'The password must be at least 20 characters, have 5 special characters, minimum 5 lowercase and 2+3 uppercase letters, at least 5 numbers (sequences must not be a part if PI), 2 greek symbols and 5 emojis. Also not use your pet name or birthday of anyone in your family or city.',
        'props'
      )
    }
  }

  const onClick = boolean('Has onClick', false, 'Props')

  return (
    <CenteredContainer>
      <ValidationListItem
        marker={marker}
        onClick={onClick ? action('onClick') : undefined}
        path={text('Path', undefined, 'props')}
        truncate={boolean('truncate', false, 'props')}
      />
    </CenteredContainer>
  )
}
