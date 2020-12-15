import React from 'react'
import Details from '../common/Details'
import PatchEvent, {unset} from '../../PatchEvent'
import styles from './styles/UnknownFields.css'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import {Button} from '@sanity/ui'

type Props = {
  fieldNames: string[]
  value: Record<string, any>
  onChange: (event: PatchEvent) => void
  readOnly?: boolean
}

export default class UnknownFields extends React.PureComponent<Props, {}> {
  handleUnsetClick = (fieldName) => {
    this.props.onChange(PatchEvent.from(unset([fieldName])))
  }

  render() {
    const {fieldNames, value, readOnly} = this.props
    const len = fieldNames.length

    return (
      <div className={styles.root}>
        <h2 className={styles.heading}>
          Found {len === 1 ? <>an</> : len} unknown {len === 1 ? <>field</> : <>fields</>}
        </h2>

        <div className={styles.content}>
          <Details>
            These are not defined in the current schema as valid fields for this value. This could
            mean that the field has been removed, or that someone else has added it to their own
            local schema that is not yet deployed.
            {fieldNames.map((fieldName) => {
              return (
                <div key={fieldName}>
                  <h4>{fieldName}</h4>
                  <ActivateOnFocus>
                    <pre className={styles.inspectValue}>
                      {JSON.stringify(value[fieldName], null, 2)}
                    </pre>
                  </ActivateOnFocus>
                  {readOnly ? (
                    <div>
                      This value is <em>read only</em> according to its enclosing schema type and
                      cannot be unset. If you want to unset, make sure you remove the{' '}
                      <strong>readOnly</strong> property from the enclosing type
                    </div>
                  ) : (
                    <Button
                      onClick={() => this.handleUnsetClick(fieldName)}
                      tone="critical"
                      text={`Unset ${fieldName}`}
                    />
                  )}
                </div>
              )
            })}
          </Details>
        </div>
      </div>
    )
  }
}
