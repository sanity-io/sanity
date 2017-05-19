//@flow
import FormBuilder from '../SanityFormBuilder'
import React from 'react'
import WithFormBuilderValue from '../WithFormBuilderValue'

export default class EditReferenceDoc extends React.Component {
  props: {
    id: string,
    typeName: string,
  }
  render() {
    const {id, typeName} = this.props
    return (
      <div>
        <WithFormBuilderValue documentId={id} typeName={typeName}>
          {props => (
            <div>
              <h2>{props.type.title}</h2>
              <div>Warning: Changes you do here will be published immediately</div>
              <FormBuilder {...props} />
            </div>
          )}
        </WithFormBuilderValue>
      </div>
    )
  }
}
