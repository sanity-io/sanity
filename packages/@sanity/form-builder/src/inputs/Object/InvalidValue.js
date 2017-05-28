import PropTypes from 'prop-types'
import React from 'react'
import DefaultButton from 'part:@sanity/components/buttons/default'
import styles from './styles/InvalidValue.css'
import PatchEvent, {unset} from '../../PatchEvent'

export default class InvalidValue extends React.PureComponent {
  static propTypes = {
    type: PropTypes.any,
    value: PropTypes.any,
    actualType: PropTypes.string,
    onChange: PropTypes.func
  };

  handleResetClicked = () => {
    this.props.onChange(PatchEvent.from(unset()))
  }

  render() {
    const {value, type, actualType} = this.props

    return (
      <div className={styles.root}>
        <h3>{type.title}</h3>
        <p>
          Encountered a value of type <code>{actualType}</code> where
          a value of type <code>{type.name}</code> was expected.
        </p>
        <p>
          The current value is:
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </p>
        <DefaultButton onClick={this.handleResetClicked} color="danger">
          Reset value
        </DefaultButton>
      </div>
    )
  }
}
