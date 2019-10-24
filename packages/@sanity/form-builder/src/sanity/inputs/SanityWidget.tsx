import React from 'react'
import {Type} from '../../typedefs'
const ENABLE_CONTEXT = () => {}

type Props = {
  type: Type
}

export default class SanityWidget extends React.Component<Props> {
  static contextTypes = {
    formBuilder: ENABLE_CONTEXT
  }
  render() {
    const {type} = this.props
    const doc = this.context.formBuilder.getDocument()
    const selectedValues = {}
    Object.keys(type.select).forEach(k => selectedValues[k] = doc[type.select[k]])

    if (type.component) {
      const Component = type.component
      return <Component {...this.props} value={selectedValues} />
    }
    return (
      <div>No component in widget</div>
    )
  }
}
