import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextField from 'part:@sanity/components/textfields/default'
import SearchTextField from 'part:@sanity/components/textfields/search'
import {withKnobs, boolean, text} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

storiesOf('Textfields')
  .addDecorator(withKnobs)
  .add('Default', () => {
    return (
      <Sanity part="part:@sanity/components/textfields/default" propTables={[DefaultTextField]}>
        <DefaultTextField
          label={text('label (prop)', 'This is the label')}
          placeholder={text('placeholder (prop)', 'This is the placeholder')}
          value={text('value (prop)')}
          hasError={boolean('hasError (prop)', false)}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onClear={action('onClear')}
          isClearable={boolean('isClearable (prop)', false)}
          hasFocus={boolean('hasFocus (prop)', false)}
        />
      </Sanity>
    )
  })
  .add('Search', () => {
    return (
      <Sanity part="part:@sanity/components/textfields/search" propTables={[SearchTextField]}>
        <SearchTextField
          label={text('label (prop)', 'This is the label')}
          placeholder={text('placeholder (prop)', 'This is the placeholder')}
          value={text('value (prop)')}
          hasFocus={boolean('hasFocus (prop)', false)}
          onChange={action('onChange')}
          isClearable={boolean('isClearable (prop)', false)}
        />
      </Sanity>
    )
  })
  .add('Spacing test', () => {
    return (
      <div style={{margin: '1rem'}}>
        <DefaultTextField label="Label" placeholder="Placeholder" />
        <DefaultTextField label="Label" placeholder="Placeholder" />
        <DefaultTextField label="Label" placeholder="Placeholder" />
        <DefaultTextField label="Label" placeholder="Placeholder" />
      </div>
    )
  })
