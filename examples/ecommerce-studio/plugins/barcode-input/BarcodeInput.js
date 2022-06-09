// Copied from packages/@sanity/cli/templates/ecommerce/plugins/barcode-input/BarcodeInput.js

import React, {useState} from 'react'
import Barcode from 'react-barcode'
import {FormFieldSet} from 'sanity/_unstable'
import {Box} from '@sanity/ui'
import {setIfMissing} from '@sanity/form-builder' // @todo fix
// import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'
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
    schemaType,
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
      onChange(patchEvent.prefixAll(field.name).prepend(setIfMissing({_type: schemaType.name})))
    },
    [onChange, schemaType.name]
  )

  const handleValid = (validState) => {
    setValid(validState)
  }

  return (
    <FormFieldSet
      level={level}
      title={schemaType.title}
      description={schemaType.description}
      legend={schemaType.title}
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
        {schemaType.fields.map((field) => (
          <>TODO</>
          // <FormBuilderInput
          //   key={field.name}
          //   description={field.type.description}
          //   title={field.type.title}
          //   type={field.type}
          //   value={value && value[field.name]}
          //   compareValue={compareValue}
          //   path={[field.name]}
          //   focusPath={focusPath}
          //   readOnly={readOnly || field.type.readOnly}
          //   presence={presence}
          //   markers={markers}
          //   onFocus={onFocus}
          //   onBlur={onBlur}
          //   onChange={(patchEvent) => handleFieldChange(field, patchEvent)}
          // />
        ))}
      </FieldWrapper>
    </FormFieldSet>
  )
})

export default BarcodeInput
