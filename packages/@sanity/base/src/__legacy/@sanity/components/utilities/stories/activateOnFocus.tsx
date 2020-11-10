import React from 'react'
import {action} from 'part:@sanity/storybook'
import Switch from 'part:@sanity/components/toggles/switch'
import {text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'

export function ActivateOnFocusStory() {
  return (
    <Sanity part="part:@sanity/components/utilities/activate-on-focus" propTables={[Switch]}>
      <div
        style={{
          height: '700px',
          width: '500px',
          border: '3px dotted #ccc',
          position: 'relative',
          padding: '20px',
        }}
      >
        <ActivateOnFocus
          onActivate={action('onActivate')}
          // onBlur={action('onBlur')}
          message={text('message', '', 'props')}
          // enableBlur={boolean('enableBlur', false, 'props')}
        >
          <textarea rows={30}>This should not be selected on first click</textarea>
        </ActivateOnFocus>
      </div>
    </Sanity>
  )
}
