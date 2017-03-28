import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {withKnobs, boolean, text, select} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'

const VALID_TYPES = [
  'color',
  'date',
  'email',
  'month',
  'password',
  'search',
  'tel',
  'text',
  'url',
  'week',
]

class DefaultTextInputTest extends React.Component {

  constructor(...args) {
    super(...args)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      value: ''
    }
  }

  handleChange(event) {
    const value = event.currentTarget.value
    this.setState({
      value: value
    })
    console.log('value', value) // eslint-disable-line
  }

  render() {
    return (
      <DefaultTextInput
        placeholder="This is the placeholder"
        onChange={this.handleChange}
        onFocus={action('onFocus')}
        onKeyPress={action('onKeyPress')}
        onBlur={action('onBlur')}
        value={this.state.value}
        id="ThisIsAnUniqueId"
      />

    )
  }
}

storiesOf('Text inputs')
  .addDecorator(withKnobs)
  .add(
  'Default',
  () => {
    return (
      <Sanity part="part:@sanity/components/textinputs/default" propTables={[DefaultTextInput]}>
        <DefaultTextInput
          placeholder={text('placeholder', 'This is the placeholder')}
          value={text('value', '')}
          type={select('type', VALID_TYPES, 'text')}
          hasError={boolean('hasError', false)}
          hasFocus={boolean('hasFocus', false)}
          isClearable={boolean('isClearable', false)}
          isSelected={boolean('isSelected', false)}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onKeyPress={action('onKeyPress')}
          onBlur={action('onBlur')}
          onClear={action('onClear')}
          id="ThisIsAnUniqueId"
        />
      </Sanity>
    )
  }
)
.add(
  'Default (test)',
  () => {
    return (
      <DefaultTextInputTest
        placeholder={text('placeholder', 'This is the placeholder')}
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onKeyPress={action('onKeyPress')}
        onBlur={action('onBlur')}
        id="ThisIsAnUniqueId"
      />
    )
  }
)
