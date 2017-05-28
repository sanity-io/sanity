import PropTypes from 'prop-types'
import React from 'react'
import DefaultButton from 'part:@sanity/components/buttons/default'
import styles from './styles/InvalidValue.css'

export default class InvalidValue extends React.PureComponent {
  static propTypes = {
    validTypes: PropTypes.array,
    value: PropTypes.any,
    actualType: PropTypes.string,
    onRemove: PropTypes.func
  };

  handleRemoveClick = () => {
    this.props.onRemove()
  }

  render() {
    const {value, validTypes, actualType} = this.props

    return (
      <div className={styles.root}>
        <h3>Item has invalid type: <code>{actualType}</code></h3>
        <details>
          <div>
            Encountered an item of type <code>{actualType}</code>, but
            only the following types are allowed according to schema: {
              validTypes.map(validType => (<li key={validType}><code>{validType}</code></li>))
            }
          </div>

          <h4>The item value is:</h4>
          <pre>{JSON.stringify(value, null, 2)}</pre>
          <DefaultButton onClick={this.handleRemoveClick} color="danger">
            Remove item
          </DefaultButton>
        </details>
      </div>
    )
  }
}
