import React from 'react'
import SlugInput from './SlugInput'
import withDocument from '../../utils/withDocument'

export default function createSlugInput({validate, slugify}) {
  return withDocument(class CustomSlugInput extends React.PureComponent {
    render() {
      return (
        <SlugInput {...this.props} checkValidityFn={validate} slugifyFn={slugify} />
      )
    }
  })
}
