import {Popover} from 'part:@sanity/components/popover'
import {boolean, select, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
  const children = text('Children', 'Content', 'Props')
  const open = boolean('Open', true, 'Props')
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

  const popoverContent = children ? <div style={{padding: '1em'}}>{children}</div> : null

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[Popover]}>
        <Popover content={popoverContent as any} open={open} placement={placement}>
          <span
            style={{
              display: 'inline-block',
              padding: '0.25em',
              background: 'rgba(127, 127, 127, 0.5)'
            }}
          >
            Reference
          </span>
        </Popover>
      </Sanity>
    </CenteredContainer>
  )
}
