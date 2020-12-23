import React from 'react'
import {Button} from '@sanity/ui'
import styles from '../ObjectInput/styles/UnknownFields.css'
import PatchEvent, {set, unset} from '../../PatchEvent'
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
  onChange?: (event: PatchEvent) => void
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
          <Button
            key={`${converter.from}-${converter.to}`}
            onClick={() => this.handleConvertTo(converter.convert(value))}
            tone="primary"
            text={`Convert value to ${converter.to}`}
          />
        ))}
        <div className={styles.buttonWrapper}>
          <Button onClick={this.handleClearClick} tone="critical" text="Remove value" />
        </div>
      </>
    )

    return <Warning heading="Content has invalid type" message={message} />
  }
}
