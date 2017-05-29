import PropTypes from 'prop-types'
import React from 'react'
import DefaultButton from 'part:@sanity/components/buttons/default'
import styles from './InvalidValue.css'
import PatchEvent, {unset} from '../../PatchEvent'

export default class InvalidValue extends React.PureComponent {
  static propTypes = {
    actualType: PropTypes.string,
    validTypes: PropTypes.array,
    value: PropTypes.any,
    onChange: PropTypes.func
  }

  handleClearClick = () => {
    this.props.onChange(PatchEvent.from(unset()))
  }

  renderValidTypes() {
    const {validTypes} = this.props
    if (validTypes.length === 1) {
      return (
        <div>
          Only content of type <code>{validTypes[0]}</code> are valid here according to schema
        </div>
      )
    }
    return (
      <div>
        Only the following types are valid here according to schema: {
        validTypes.map(validType => (<li key={validType}><code>{validType}</code></li>))
      }
      </div>
    )
  }

  render() {
    const {value, actualType} = this.props
    return (
      <div className={styles.root}>
        <h3>Content has invalid type: <code>{actualType}</code></h3>
        <details>
          Encountered a value of type <code>{actualType}</code>.
          {this.renderValidTypes()}
          <h4>The current value is:</h4>
          <pre>{JSON.stringify(value, null, 2)}</pre>
          <DefaultButton onClick={this.handleClearClick} color="danger">
            Clear
          </DefaultButton>
        </details>
      </div>
    )
  }
}
