/* eslint-disable no-console */
import React from 'react'
import PortableTextInput from '../PortableTextInput'

export class OtherInput extends React.Component {
  blur() {
    console.log('other input blur')
  }
  focus() {
    console.log('other input focus')
  }
  render() {
    return <div>Not implemented</div>
  }
}

export const inputResolver = (input: any) => {
  if (input.type.name === 'block') {
    return PortableTextInput
  }
  return OtherInput
}
