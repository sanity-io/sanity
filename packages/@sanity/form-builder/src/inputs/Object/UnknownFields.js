import React from 'react'
import Details from '../common/Details'
import DefaultButton from 'part:@sanity/components/buttons/default'
import PatchEvent, {unset} from '../../PatchEvent'

export default class UnknownFields extends React.Component {
  handleUnsetClick = (fieldName) => {
    this.props.onChange(PatchEvent.from(unset([fieldName])))
  }

  render() {
    const {fieldNames, value} = this.props
    return (
      <div>
        <h2>Found {fieldNames.length} unknown fields</h2>
        <Details>
          These are not defined in schema as valid fields for this value.
          This could mean that the field has been removed, or that someone else has added it to their own local schema that is not yet deployed.
          {fieldNames.map(fieldName => {
            return (
              <div>
                <h4>{fieldName}</h4>
                <pre style={{border: '1px solid #aaa', maxHeight: 200, overflowY: 'scroll', backgroundColor: 'white'}}>
                  {JSON.stringify(value[fieldName], null, 2)}
                </pre>
                <DefaultButton onClick={() => this.handleUnsetClick(fieldName)} color="danger">
                  Unset {fieldName}
                </DefaultButton>
              </div>
            )
          })}
        </Details>
      </div>
    )
  }
}
