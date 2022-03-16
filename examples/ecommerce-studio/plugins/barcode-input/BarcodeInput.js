// Copied from packages/@sanity/cli/templates/ecommerce/plugins/barcode-input/BarcodeInput.js

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import Barcode from 'react-barcode'
import {FormFieldSet} from '@sanity/base/components'
import {Box} from '@sanity/ui'
import {setIfMissing} from '@sanity/form-builder'
import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'
import styled from 'styled-components'

const BarcodeRoot = styled(Box)`
  svg {
    display: block;
    margin: 1em auto;
    max-width: 100%;
  }
`

const FieldWrapper = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-gap: 1em;
`

const ErrorMessage = styled.div`
  color: #e66666;
  text-align: center;
  padding: 1em;
`

const BarcodeInput = React.forwardRef(function BarcodeInput(props, ref) {
  const {
    level,
    type,
    value,
    readOnly,
    markers,
    presence,
    compareValue,
    focusPath,
    onFocus,
    onBlur,
    onChange,
  } = props
  const [valid, setValid] = useState(true)
  const handleFieldChange = React.useCallback(
    (field, patchEvent) => {
      onChange(patchEvent.prefixAll(field.name).prepend(setIfMissing({_type: type.name})))
    },
    [onChange, type.name]
  )

  const handleValid = (validState) => {
    setValid(validState)
  }

  return (
    <FormFieldSet
      level={level}
      title={type.title}
      description={type.description}
      legend={type.title}
    >
      <BarcodeRoot isValid={valid}>
        {value && value.barcode && (
          <Barcode
            textAlign="center"
            value={value.barcode}
            format={value.format || ''}
            valid={handleValid} // eslint-disable-line react/jsx-handler-names
          />
        )}
        {!valid && <ErrorMessage>Not valid {value.format}</ErrorMessage>}
      </BarcodeRoot>
      <FieldWrapper>
        {type.fields.map((field) => (
          <FormBuilderInput
            key={field.name}
            description={field.type.description}
            title={field.type.title}
            type={field.type}
            value={value && value[field.name]}
            compareValue={compareValue}
            path={[field.name]}
            focusPath={focusPath}
            readOnly={readOnly || field.type.readOnly}
            presence={presence}
            markers={markers}
            onFocus={onFocus}
            onBlur={onBlur}
            onChange={(patchEvent) => handleFieldChange(field, patchEvent)}
          />
        ))}
      </FieldWrapper>
    </FormFieldSet>
  )
})

BarcodeInput.propTypes = {
  level: PropTypes.number,
  value: PropTypes.object,
  onChange: PropTypes.func,
  type: PropTypes.object,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
}

export default BarcodeInput
