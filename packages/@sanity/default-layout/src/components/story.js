import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import TagsTextField from 'part:@sanity/components/tags/textfield'
import {withKnobs, array, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Tags')
  .addDecorator(withKnobs)
  .add(
    'Create new',
    () => {
      return (
        <div>Test</div>
      )
    }
  )
  
