import PropTypes from 'prop-types'
import React from 'react'
import DefaultButton from 'part:@sanity/components/buttons/default'
import Details from '../common/Details'
import styles from './InvalidValueInput.css'
import PatchEvent, {set, unset} from '../../PatchEvent'
import CONVERTERS from './converters'

const setAutoHeight = el => {
  if (el) {
    el.style.height = `${Math.min(300, el.scrollHeight)}px`
    el.style.padding = `${4}px`
    el.style.overflow = 'auto'
  }
}

function getConverters(value, actualType, validTypes) {
  if (!(actualType in CONVERTERS)) {
    return []
  }
  return Object.keys(CONVERTERS[actualType])
    .filter(targetType => validTypes.includes(targetType))
    .map(targetType => ({
      from: actualType,
      to: targetType,
      ...CONVERTERS[actualType][targetType]
    }))
    .filter(converter => converter.test(value))
}

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

  handleConvertTo = converted => {
    this.props.onChange(PatchEvent.from(set(converted)))
  }

  focus() {
    if (this.element) {
      this.element.focus()
    }
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
        Only the following types are valid here according to schema:{' '}
        {validTypes.map(validType => (
          <li key={validType}>
            <code>{validType}</code>
          </li>
        ))}
      </div>
    )
  }

  setElement = element => {
    this.element = element
  }
  render() {
    const {value, actualType, validTypes} = this.props
    const converters = getConverters(value, actualType, validTypes)
    return (
      <div className={styles.root} tabIndex={0} ref={this.setElement}>
        <h3>
          Content has invalid type: <code>{actualType}</code>
        </h3>
        <Details>
          Encountered a value of type <code>{actualType}</code>.
          {this.renderValidTypes()}
          <h4>The current value is:</h4>
          <textarea
            ref={setAutoHeight}
            className={styles.currentValueDump}
            onFocus={e => e.target.select()}
            readOnly
            value={value && typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
          />
          {converters.map(converter => (
            <DefaultButton
              key={`${converter.from}-${converter.to}`}
              onClick={() => this.handleConvertTo(converter.convert(value))}
              color="primary"
            >
              Convert value to {converter.to}
            </DefaultButton>
          ))}
        </Details>
        <div className={styles.removeButtonWrapper}>
          <DefaultButton onClick={this.handleClearClick} color="danger">
            Remove value
          </DefaultButton>
        </div>
      </div>
    )
  }
}
