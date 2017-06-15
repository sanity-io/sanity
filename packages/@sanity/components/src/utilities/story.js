import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import Switch from 'part:@sanity/components/toggles/switch'
import {withKnobs, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'

storiesOf('Utilities')
.addDecorator(withKnobs)
.add(
  'Activate on focus',
  () => {
    return (
      <Sanity part="part:@sanity/components/utilities/activate-on-focus" propTables={[Switch]}>
        <div style={{height: '700px', width: '500px', border: '3px dotted #ccc', position: 'relative', padding: '20px'}}>
          <ActivateOnFocus
            onFocus={action('onFocus')}
            onBlur={action('onBlur')}
            message={text('Message')}
            enableBlur={boolean('Enable Blur', false)}
          >
            <textarea rows="30">
              This should not scroll
            </textarea>
          </ActivateOnFocus>
        </div>
      </Sanity>
    )
  }
)
