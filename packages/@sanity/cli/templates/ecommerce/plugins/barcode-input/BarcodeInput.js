// Copied from packages/@sanity/cli/templates/ecommerce/plugins/barcode-input/BarcodeInput.js

import React, {useState} from 'react'
import {Box, Text} from '@sanity/ui'
import {MemberField} from 'sanity/form'
import Barcode from 'react-barcode'
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

const ErrorMessage = styled(Text)`
  color: #e66666;
  text-align: center;
  padding: 1em;
`

export const BarcodeInput = function BarcodeInput(props) {
  const {value, renderInput, renderItem, renderPreview, renderField, members} = props
  const [valid, setValid] = useState(true)

  const memberFields = members.filter((member) => member.kind === 'field')

  return (
    <>
      <BarcodeRoot>
        {value && value.barcode && (
          <Barcode
            textAlign="center"
            value={value.barcode}
            format={value.format || ''}
            valid={setValid}
          />
        )}
        {!valid && <ErrorMessage>Not a valid {value?.format}</ErrorMessage>}
      </BarcodeRoot>
      <FieldWrapper>
        {memberFields.map((member) => (
          <MemberField
            key={member.key}
            member={member}
            renderInput={renderInput}
            renderField={renderField}
            renderItem={renderItem}
            renderPreview={renderPreview}
          />
        ))}
      </FieldWrapper>
    </>
  )
}
