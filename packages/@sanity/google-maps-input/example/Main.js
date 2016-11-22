import React from 'react'
import FormBuilder from 'part:@sanity/form-builder'
import SanityIntlProvider from 'part:@sanity/base/sanity-intl-provider'

export default class QuickstartExample extends React.Component {
  state = {
    editorValue: FormBuilder.createEmpty('myTestLocation')
  }

  handleChange = event => {
    this.setState({editorValue: this.state.editorValue.patch(event.patch)})
  }

  handleLogClick = event => {
    console.log(this.state.editorValue)
  }

  render() {
    return (
      <SanityIntlProvider supportedLanguages={['en-US']}>
        <FormBuilder value={this.state.editorValue} onChange={this.handleChange} />
        <button type="button" onClick={this.handleLogClick}>Output current value to console</button>
      </SanityIntlProvider>
    )
  }
}
