import {action} from 'part:@sanity/storybook'
import DefaultTextArea from 'part:@sanity/components/textareas/default'
import {number, text, boolean} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import React from 'react'

export function DefaultStory() {
  return (
    <CenteredContainer>
      <div style={{width: '100%', maxWidth: 640}}>
        <Sanity part="part:@sanity/components/textinputs/default" propTables={[DefaultTextArea]}>
          <DefaultTextArea
            isClearable={boolean('isClearable', false, 'props')}
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            onChange={action('onChange')}
            onClear={action('onClear')}
            onFocus={action('onFocus')}
            onKeyPress={action('onKeyPress')}
            onBlur={action('onBlur')}
            rows={number('rows', 2, 'props')}
            value={text('value', '', 'props')}
            disabled={boolean('disabled', false, 'props')}
            readOnly={boolean('readOnly', false, 'props')}
          />
        </Sanity>
      </div>
    </CenteredContainer>
  )
}
