import DefaultTextField from 'part:@sanity/components/textfields/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
  return (
    <CenteredContainer>
      <div style={{width: '100%', maxWidth: 640}}>
        <Sanity part="part:@sanity/components/textfields/default" propTables={[DefaultTextField]}>
          <DefaultTextField
            label={text('label', 'This is the label', 'props')}
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            value={text('value', undefined, 'props')}
            hasError={boolean('hasError', false, 'props')}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onClear={action('onClear')}
            isClearable={boolean('isClearable', false, 'props')}
            // hasFocus={boolean('hasFocus', false, 'props')}
          />
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
