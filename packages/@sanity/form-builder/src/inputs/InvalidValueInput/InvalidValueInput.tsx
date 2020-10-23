import React from 'react'
import DefaultButton from 'part:@sanity/components/buttons/default'
import styles from '../ObjectInput/styles/UnknownFields.css'
import PatchEvent, {set, unset} from '../../PatchEvent'
import {ItemValue} from '../ArrayInput/typedefs'
import Warning from '../Warning'
import CONVERTERS from './converters'
import {UntypedValueInput} from './UntypedValueInput'

function getConverters(value, actualType, validTypes) {
  if (!(actualType in CONVERTERS)) {
    return []
  }

  return Object.keys(CONVERTERS[actualType])
    .filter((targetType) => validTypes.includes(targetType))
    .map((targetType) => ({
      from: actualType,
      to: targetType,
      ...CONVERTERS[actualType][targetType],
    }))
    .filter((converter) => converter.test(value))
}

type InvalidValueProps = {
  actualType?: string
  validTypes?: string[]
  value?: unknown
  onChange?: (event: PatchEvent, valueOverride?: ItemValue) => void
}
export default class InvalidValueInput extends React.PureComponent<InvalidValueProps, {}> {
  handleClearClick = () => {
    this.props.onChange(PatchEvent.from(unset()))
  }

  handleConvertTo = (converted) => {
    this.props.onChange(PatchEvent.from(set(converted)))
  }

  renderValidTypes() {
    const {validTypes} = this.props
    if (validTypes.length === 1) {
      return (
        <div>
          Only content of type <code>{validTypes[0]}</code> are valid here according to the schema.
          This could mean that the type has changed, or that someone else has added it to their own
          local schema that is not yet deployed.
        </div>
      )
    }

    return (
      <div>
        Only the following types are valid here according to schema:{' '}
        {validTypes.map((validType) => (
          <li key={validType}>
            <code>{validType}</code>
          </li>
        ))}
      </div>
    )
  }

  render() {
    const {value, actualType, validTypes, onChange} = this.props

    if (typeof value === 'object' && value !== null && !('_type' in value)) {
      return (
        <UntypedValueInput
          value={value as Record<string, unknown>}
          validTypes={validTypes}
          onChange={onChange}
        />
      )
    }

    const converters = getConverters(value, actualType, validTypes)
    const message = (
      <>
        Encountered a value of type <code>{actualType}</code>.{this.renderValidTypes()}
        <h4>{actualType}</h4>
        <pre className={styles.inspectValue}>{JSON.stringify(value, null, 2)}</pre>
        {converters.map((converter) => (
          <DefaultButton
            key={`${converter.from}-${converter.to}`}
            onClick={() => this.handleConvertTo(converter.convert(value))}
            color="primary"
          >
            Convert value to {converter.to}
          </DefaultButton>
        ))}
        <div className={styles.buttonWrapper}>
          <DefaultButton onClick={this.handleClearClick} color="danger">
            Remove value
          </DefaultButton>
        </div>
      </>
    )

    return <Warning heading="Content has invalid type" message={message} />
  }
}
