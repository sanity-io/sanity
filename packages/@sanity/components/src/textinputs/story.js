import React from 'react'
import {storiesOf, action} from 'part:@sanity/storybook'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {withKnobs, boolean, text, select, object} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import CustomStyles from './styles/CustomStyles.css'

const VALID_TYPES = [
  'color',
  'date',
  'email',
  'month',
  'password',
  'search',
  'tel',
  'text',
  'number',
  'url',
  'week'
]

class DefaultTextInputTest extends React.PureComponent {
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
  .add('Default', () => {
    return (
      <Sanity part="part:@sanity/components/textinputs/default" propTables={[DefaultTextInput]}>
        <DefaultTextInput
          placeholder={text('placeholder (prop)', 'This is the placeholder')}
          value={text('value (prop)', '')}
          type={select('type (prop)', ['text', 'number', 'email', 'tel'], 'text')}
          isSelected={boolean('isSelected (prop)', false)}
          disabled={boolean('disabled (prop)', false)}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onKeyPress={action('onKeyPress')}
          onBlur={action('onBlur')}
          id="ThisIsAnUniqueId"
        />
      </Sanity>
    )
  })
  .add('Custom style', () => {
    return (
      <Sanity part="part:@sanity/components/textinputs/default" propTables={[DefaultTextInput]}>
        <DefaultTextInput
          placeholder={text('placeholder (prop)', 'This is the placeholder')}
          value={text('value (prop)', false)}
          type={select('type (prop)', ['text', 'number', 'email', 'tel'], 'text')}
          selected={boolean('selected (prop)', false)}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onKeyPress={action('onKeyPress')}
          onBlur={action('onBlur')}
          styles={object('styles (prop)', CustomStyles)}
          id="ThisIsAnUniqueId"
        />
      </Sanity>
    )
  })

  .add('Default (test)', () => {
    return (
      <DefaultTextInputTest
        placeholder={text('placeholder (prop)', 'This is the placeholder')}
        value={text('value (prop)', '')}
        type={select('type (prop)', VALID_TYPES, 'text')}
        hasError={boolean('hasError (prop)', false)}
        isClearable={boolean('isClearable (prop)', false)}
        isSelected={boolean('isSelected (prop)', false)}
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onKeyPress={action('onKeyPress')}
        onBlur={action('onBlur')}
        onClear={action('onClear')}
        id="ThisIsAnUniqueId"
      />
    )
  })
