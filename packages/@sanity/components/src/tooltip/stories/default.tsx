import {Tooltip} from 'part:@sanity/components/tooltip'
import {select, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
  const children = text('Children', 'Reference', 'Props')
  const placement = select(
    'Placement',
    {
      'top-start': 'Top start',
      top: 'Top',
      'top-end': 'Top end',
      'right-start': 'Right start',
      right: 'Right',
      'right-end': 'Right end',
      'bottom-start': 'Bottom start',
      bottom: 'Bottom',
      'bottom-end': 'Bottom end',
      'left-start': 'Left start',
      left: 'Left',
      'left-end': 'Left end'
    },
    'bottom',
    'Props'
  )
  const tone = select(
    'Tone',
    {
      '': '(none)',
      navbar: 'Navbar'
    },
    '',
    'Props'
  )

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[Tooltip]}>
        <Tooltip content={(<>{children}</>) as any} placement={placement} tone={tone || undefined}>
          <span style={{display: 'inline-block'}}>Hover me</span>
        </Tooltip>
      </Sanity>
    </CenteredContainer>
  )
}
