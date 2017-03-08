import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import SearchTextField from 'part:@sanity/components/textfields/search'
import {withKnobs, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Textfields')
.addDecorator(withKnobs)
.add(
  'Default',
  () => {
    return (
      <Sanity part="part:@sanity/components/textfields/default" propTables={[DefaultTextField]}>
        <DefaultTextField
          label={text('label', 'This is the label')}
          placeholder={text('placeholder', 'This is the placeholder')}
          value={text('value')}
          error={boolean('error', false)}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onClear={action('onClear')}
          showClearButton={boolean('clear button', false)}
          focus={boolean('focus', false)}
        />
      </Sanity>
    )
  }
)
.add(
  'Search',
  () => {
    return (
      <Sanity part="part:@sanity/components/textfields/search" propTables={[SearchTextField]}>
        <SearchTextField
          label={text('label', 'This is the label')}
          placeholder={text('placeholder', 'This is the placeholder')}
          value={text('value')}
          focus={boolean('focus', false)}
          onChange={action('onChange')}
          showClearButton={boolean('clear button', false)}
        />
      </Sanity>
    )
  }
)
