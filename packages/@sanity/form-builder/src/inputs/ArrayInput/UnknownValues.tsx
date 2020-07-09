import React from 'react'
import DefaultButton from 'part:@sanity/components/buttons/default'
import ActivateOnFocus from 'part:@sanity/components/utilities/activate-on-focus'
import Details from '../common/Details'
import styles from '../ObjectInput/styles/UnknownFields.css'
import {ItemValue} from './typedefs'

type Props = {
  values: ItemValue[]
  onClick: (item: ItemValue) => void
  readOnly?: boolean
}

export default class UnknownFields extends React.PureComponent<Props, {}> {
  handleUnsetClick = value => {
    this.props.onClick(value)
  }

  render() {
    const {values = [], readOnly} = this.props
    const len = values.length

    return (
      <div className={styles.root}>
        <h2 className={styles.heading}>
          Found {len === 1 ? <>a</> : len} {len === 1 ? <>value</> : <>values</>} with{' '}
          {len === 1 && <>an</>} unknown {len === 1 ? <>type</> : <>types</>}
        </h2>

        <div className={styles.content}>
          <Details>
            These are not defined in the current schema as valid types for this array. This could
            mean that the type has been removed, or that someone else has added it to their own
            local schema that is not yet deployed.
            {values.map(item => {
              return (
                <div key={item._type}>
                  <h4>{item._type}</h4>
                  <ActivateOnFocus>
                    <pre className={styles.inspectValue}>{JSON.stringify(item, null, 2)}</pre>
                  </ActivateOnFocus>
                  {readOnly ? (
                    <div>
                      This array is <em>read only</em> according to its enclosing schema type and
                      values cannot be unset. If you want to unset a value, make sure you remove the{' '}
                      <strong>readOnly</strong> property from the enclosing type.
                    </div>
                  ) : (
                    <DefaultButton onClick={() => this.handleUnsetClick(item)} color="danger">
                      Unset {item._type}
                    </DefaultButton>
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
