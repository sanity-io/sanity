import React from 'react'
import {Type} from '../../typedefs'
import FormField from 'part:@sanity/components/formfields/default'

type Props = {
  type: Type
}

export default class SanityWidget extends React.Component<Props> {
  render() {
    const {type} = this.props

    if (type.component) {
      const Component = type.component
      return (
        <FormField
          label={type.title}
          description={type.description}
        >
          <Component {...this.props} />
        </FormField>

      )
    }
    return (
      <div>No component in widget</div>
    )
  }
}
