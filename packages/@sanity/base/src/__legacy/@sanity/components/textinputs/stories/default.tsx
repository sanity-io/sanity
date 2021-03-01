import React from 'react'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, text, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'

export function DefaultStory() {
  return (
    <CenteredContainer>
      <div style={{width: '100%', maxWidth: 640}}>
        <Sanity part="part:@sanity/components/textinputs/default" propTables={[DefaultTextInput]}>
          <DefaultTextInput
            disabled={boolean('Disabled', false, 'props')}
            hasError={boolean('Has errors', false, 'props')}
            id="ThisIsAnUniqueId"
            isSelected={boolean('Is selected', false, 'props')}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onKeyPress={action('onKeyPress')}
            onBlur={action('onBlur')}
            placeholder={text('Placeholder', 'This is the placeholder', 'props')}
            readOnly={boolean('Read-only', false, 'props')}
            type={select('Type', ['text', 'number', 'email', 'tel'], 'text', 'props')}
            value={text('Value', '', 'props')}
          />
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
