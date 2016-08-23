import React from 'react'
import {storiesOf, action} from 'component:@sanity/storybook'
import DefaultTextInput from 'component:@sanity/components/textinputs/default'


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
  .addWithInfo(
  'Default',
  `
    Default textinput
  `,
  () => {
    return (
      <DefaultTextInput
        placeholder="This is the placeholder"
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
    role: 'component:@sanity/components/textinputs/default'
  }
)
.addWithInfo(
  'Default (test)',
  `
    Default textinput
  `,
  () => {
    return (
      <DefaultTextInputTest
        placeholder="This is the placeholder"
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
    role: 'component:@sanity/components/textinputs/default'
  }
)
.addWithInfo(
  'Default with clearbutton',
  `
    Default textinput
  `,
  () => {
    return (
      <DefaultTextInput
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onKeyPress={action('onKeyPress')}
        onClear={action('onClear')}
        onBlur={action('onBlur')}
        value="This field has a clearbutton"
        id="ThisIsAnUniqueId_ufthw"
        showClearButton
      />
    )
  },
  {
    propTables: [DefaultTextInput],
    role: 'component:@sanity/components/textinputs/default'
  }
)

.addWithInfo(
  'Default (selected)',
  `
    Default textinput
  `,
  () => {
    return (
      <DefaultTextInput
        placeholder="This is the placeholder"
        onChange={action('onChange')}
        onFocus={action('onFocus')}
        onKeyPress={action('onKeyPress')}
        onClear={action('onClear')}
        onBlur={action('onBlur')}
        value="This field has a clearbutton"
        id="ThisIsAnUniqueId_ufthw"
        showClearButton
        selected
      />
    )
  },
  {
    propTables: [DefaultTextInput],
    role: 'component:@sanity/components/textinputs/default'
  }
)
