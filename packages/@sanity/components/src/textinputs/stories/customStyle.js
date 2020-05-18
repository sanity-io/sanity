import React from 'react'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, text, select, object} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'

import styles from './customStyle.css'

export function CustomStyleStory() {
  return (
    <CenteredContainer>
      <div style={{width: '100%', maxWidth: 640}}>
        <Sanity part="part:@sanity/components/textinputs/default" propTables={[DefaultTextInput]}>
          <DefaultTextInput
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            value={text('value', false, 'props')}
            type={select('type', ['text', 'number', 'email', 'tel'], 'text', 'props')}
            selected={boolean('selected', false, 'props')}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onKeyPress={action('onKeyPress')}
            onBlur={action('onBlur')}
            styles={object('styles', styles, 'props')}
            id="ThisIsAnUniqueId"
          />
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
