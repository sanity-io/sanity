import PropTypes from 'prop-types'
import React from 'react'
import DefaultButton from 'part:@sanity/components/buttons/default'
import Details from './Details'
import styles from './InvalidValue.css'
import PatchEvent, {set, unset} from '../../PatchEvent'
import CONVERTERS from './converters'

const setAutoHeight = el => {
  if (el) {
    el.style.height = Math.min(300, el.scrollHeight) + 'px'
    el.style.padding = 4 + 'px'
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
    const {value, actualType, validTypes} = this.props
    const converters = getConverters(value, actualType, validTypes)
    return (
      <div className={styles.root}>
        <h3>Content has invalid type: <code>{actualType}</code></h3>
        <Details>
          Encountered a value of type <code>{actualType}</code>.
          {this.renderValidTypes()}
          <h4>The current value is:</h4>
          <textarea
            ref={setAutoHeight}
            className={styles.currentValueDump}
            onFocus={e => e.target.select()}
            value={(value && typeof value === 'object') ? JSON.stringify(value, null, 2) : value}
          />
          <DefaultButton onClick={this.handleClearClick} color="danger">
            Clear
          </DefaultButton>
          {}
          {converters.map(converter => (
            <DefaultButton onClick={() => this.handleConvertTo(converter.convert(value))} color="danger">
              Convert to {converter.to}: <code>{JSON.stringify(converter.convert(value))}</code>
            </DefaultButton>
          ))}
        </Details>
      </div>
    )
  }
}
