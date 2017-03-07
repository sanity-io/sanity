import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {withKnobs, boolean, text, select} from 'part:@sanity/storybook/addons/knobs'

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
      <DefaultTextInput
        placeholder={text('placeholder', 'This is the placeholder')}
        value={text('value', false)}
        type={select('type', ['text', 'number', 'email', 'tel'], 'text')}
        error={boolean('error', false)}
        focus={boolean('focus', false)}
        showClearButton={boolean('clear button', false)}
        selected={boolean('selected', false)}
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onKeyPress={action('onKeyPress')}
        onBlur={action('onBlur')}
        id="ThisIsAnUniqueId"
      />
    )
  },
  {
    propTables: [DefaultTextInput],
    role: 'part:@sanity/components/textinputs/default'
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
  },
  {
    propTables: [DefaultTextInput],
    role: 'part:@sanity/components/textinputs/default'
  }
)
