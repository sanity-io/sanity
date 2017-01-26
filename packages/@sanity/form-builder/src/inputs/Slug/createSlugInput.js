import React from 'react'
import SlugInput from './SlugInput'

export default function createSlugInput({validate, slugify}) {
  return class CustomSlugInput extends React.PureComponent {
    static passDocument = true;
    render() {
      return (
        <SlugInput {...this.props} checkValidityFn={validate} slugifyFn={slugify} />
      )
    }
  }
}
