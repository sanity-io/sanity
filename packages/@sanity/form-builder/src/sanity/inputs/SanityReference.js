
import React from 'react'
import {search, valueToString} from './client-adapters/reference'
import ReferenceInput from '../../inputs/Reference'

export default class SanityReference extends React.Component {
  setInput = input => {
    this.input = input
  }
  focus() {
    this.input.focus()
  }
  render() {
    return <ReferenceInput {...this.props} onSearch={search} valueToString={valueToString} />
  }
}
