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

const centerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  width: '100%',
  position: 'absolute',
  boxSizing: 'border-box',
  padding: '2rem',
  top: 0,
  left: 0
}

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
      <div style={centerStyle}>
        <Sanity part="part:@sanity/components/textinputs/default" propTables={[DefaultTextInput]}>
          <DefaultTextInput
            placeholder={text('placeholder', 'This is the placeholder', 'props')}
            value={text('value', '', 'props')}
            type={select('type', ['text', 'number', 'email', 'tel'], 'text', 'props')}
            isSelected={boolean('isSelected', false, 'props')}
            disabled={boolean('disabled', false, 'props')}
            readOnly={boolean('readOnly', false, 'props')}
            onChange={action('onChange')}
            onFocus={action('onFocus')}
            onKeyPress={action('onKeyPress')}
            onBlur={action('onBlur')}
            id="ThisIsAnUniqueId"
          />
        </Sanity>
      </div>
    )
  })
  .add('Custom style', () => {
    return (
      <div style={centerStyle}>
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
            styles={object('styles', CustomStyles, 'props')}
            id="ThisIsAnUniqueId"
          />
        </Sanity>
      </div>
    )
  })

  .add('Default (test)', () => {
    return (
      <div style={centerStyle}>
        <DefaultTextInputTest
          placeholder={text('placeholder', 'This is the placeholder', 'props')}
          value={text('value', '', 'props')}
          type={select('type', VALID_TYPES, 'text', 'props')}
          hasError={boolean('hasError', false, 'props')}
          isClearable={boolean('isClearable', false, 'props')}
          isSelected={boolean('isSelected', false, 'props')}
          onChange={action('onChange')}
          onFocus={action('onFocus')}
          onKeyPress={action('onKeyPress')}
          onBlur={action('onBlur')}
          onClear={action('onClear')}
          id="ThisIsAnUniqueId"
        />
      </div>
    )
  })
