import React from 'react'
import SlugInput from './SlugInput'
import withDocument from '../../utils/withDocument'

export default function createSlugInput({validate, slugify}) {
  return withDocument(class CustomSlugInput extends React.PureComponent {
    focus() {
      this._input.focus()
    }
    setInput = input => {
      this._input = input
    }
    render() {
      return (
        <SlugInput ref={this.setRef} {...this.props} checkValidityFn={validate} slugifyFn={slugify} />
      )
    }
  })
}
