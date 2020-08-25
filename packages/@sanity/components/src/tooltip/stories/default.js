import {Tooltip} from 'part:@sanity/components/tooltip'
import {select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
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

  return (
    <CenteredContainer>
      <Sanity part="part:@sanity/components/dialogs/default" propTables={[Tooltip]}>
        <Tooltip
          content={
            <>
              Contentasd asdasd
              <br />
              alskdmalsd masldmk
              <br />
              alskdmalsd masldmk
              <br />
              alskdmalsd masldmk
            </>
          }
          placement={placement}
        >
          <span>hover me</span>
        </Tooltip>
      </Sanity>
    </CenteredContainer>
  )
}
