import {Avatar} from 'part:@sanity/components/avatar'
import {color, select, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
  const props = {
    animateArrowFrom:
      select(
        'Animate arrow from',
        {
          '': '(none)',
          top: 'Top',
          inside: 'Inside',
          bottom: 'Bottom'
        },
        '',
        'Props'
      ) || undefined,
    arrowPosition:
      select(
        'Arrow position',
        {
          '': '(none)',
          top: 'Top',
          inside: 'Inside',
          bottom: 'Bottom'
        },
        '',
        'Props'
      ) || undefined,
    color: {
      dark: color('Color (dark)', '#0f0', 'Props'),
      light: color('Color (light)', '#0c0', 'Props')
    },
    initials: text('Intitials', 'si', 'Props'),
    size: select(
      'Size',
      {
        small: 'Small',
        medium: 'Medium',
        large: 'Large'
      },
      'small',
      'Props'
    ),
    src: text('Image URL', undefined, 'Props'),
    status:
      select(
        'Status',
        {
          '': '(none)',
          online: 'Online',
          editing: 'Editing',
          inactive: 'Inactive'
        },
        '',
        'Props'
      ) || undefined,
    title: text('Title', 'Sanity.io', 'Props'),
    tone:
      select(
        'Tone',
        {
          '': '(none)',
          navbar: 'Navbar'
        },
        '',
        'Props'
      ) || undefined
  }

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[Avatar]}>
        <Avatar {...props} />
      </Sanity>
    </CenteredContainer>
  )
}
