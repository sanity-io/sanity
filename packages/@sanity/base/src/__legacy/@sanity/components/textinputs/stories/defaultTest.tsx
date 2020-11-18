import React from 'react'
import DefaultTextInput from 'part:@sanity/components/textinputs/default'
import {action} from 'part:@sanity/storybook/addons/actions'
import {boolean, text, select} from 'part:@sanity/storybook/addons/knobs'
import {CenteredContainer} from 'part:@sanity/storybook/components'
import {DefaultTextInputProps} from '../types'

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
  'week',
]

interface State {
  value: string
}

// @todo: refactor to functional component
class DefaultTextInputTest extends React.PureComponent<DefaultTextInputProps, State> {
  constructor(props: DefaultTextInputProps) {
    super(props)
    this.state = {value: ''}
  }

  handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({value: event.currentTarget.value})
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

export function DefaultTestStory() {
  return (
    <CenteredContainer>
      <div style={{width: '100%', maxWidth: 640}}>
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
    </CenteredContainer>
  )
}
