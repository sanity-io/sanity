// @flow
import React from 'react'
import Details from '../common/Details'
import DefaultButton from 'part:@sanity/components/buttons/default'
import PatchEvent, {unset} from '../../PatchEvent'
import styles from './styles/UnknownFields.css'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'

export default class UnknownFields extends React.Component {
  props: {
    fieldNames: string[],
    value: Object,
    onChange: (PatchEvent) => void
  }

  handleUnsetClick = fieldName => {
    this.props.onChange(PatchEvent.from(unset([fieldName])))
  }

  render() {
    const {fieldNames, value} = this.props
    return (
      <div className={styles.root}>
        <h2 className={styles.heading}>Found {fieldNames.length} unknown fields</h2>
        <div className={styles.content}>
          <Details>
            These are not defined in the current schema as valid fields for this value.
            This could mean that the field has been removed, or that someone else has added it to their own local schema that is not yet deployed.
            {fieldNames.map(fieldName => {
              return (
                <div key={fieldName}>
                  <h4>{fieldName}</h4>
                  <ActivateOnFocus>
                    <pre className={styles.inspectValue}>
                      {JSON.stringify(value[fieldName], null, 2)}
                    </pre>
                  </ActivateOnFocus>
                  <DefaultButton onClick={() => this.handleUnsetClick(fieldName)} color="danger">
                    Unset {fieldName}
                  </DefaultButton>
                </div>
              )
            })}
          </Details>
        </div>
      </div>
    )
  }
}
