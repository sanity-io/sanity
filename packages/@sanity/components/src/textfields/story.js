import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import SearchTextField from 'part:@sanity/components/textfields/search'
import {withKnobs, boolean, text} from 'part:@sanity/storybook/addons/knobs'

storiesOf('Textfields')
.addDecorator(withKnobs)
.add(
  'Default',
  () => {
    return (
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
    )
  },
  {
    propTables: [DefaultTextField],
    role: 'part:@sanity/components/textfields/default'
  }
)
.add(
  'Search',
  () => {
    return (
      <SearchTextField
        label={text('label', 'This is the label')}
        placeholder={text('placeholder', 'This is the placeholder')}
        value={text('value')}
        focus={boolean('focus', false)}
        onChange={action('onChange')}
        showClearButton={boolean('clear button', false)}
      />
    )
  },
  {
    propTables: [SearchTextField],
    role: 'part:@sanity/components/textfields/search'
  }
)
